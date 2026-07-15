#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const host = '127.0.0.1';
const errors = [];
let output = '';

function fail(message) {
  errors.push(message);
}

function wait(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, host, resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a preview port.');
  await new Promise((resolvePromise, reject) => server.close((error) => (error ? reject(error) : resolvePromise())));
  return address.port;
}

function attributes(tag) {
  return new Map(
    [...tag.matchAll(/\b([a-z][a-z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)].map(
      (match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ''],
    ),
  );
}

function hasCustomNoindex(html) {
  return (html.match(/<meta\b[^>]*>/gi) ?? []).some((tag) => {
    const values = attributes(tag);
    if (values.get('name')?.toLowerCase() !== 'robots') return false;
    const directives = (values.get('content') ?? '')
      .split(/[\s,]+/)
      .map((value) => value.toLowerCase());
    return directives.includes('noindex') && directives.includes('follow');
  });
}

async function request(origin, path, expectedStatus) {
  const response = await fetch(`${origin}${path}`, {
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  if (response.status !== expectedStatus) {
    fail(`${path} returned HTTP ${response.status}; expected ${expectedStatus}.`);
  }
  return { body, response };
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolvePromise) => child.once('exit', resolvePromise)),
    wait(2_000).then(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }),
  ]);
}

let preview;
try {
  const port = await availablePort();
  const origin = `http://${host}:${port}`;
  preview = spawn(
    process.execPath,
    [resolve(projectRoot, 'node_modules/astro/bin/astro.mjs'), 'preview', '--host', host, '--port', String(port)],
    { cwd: projectRoot, env: { ...process.env, NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  for (const stream of [preview.stdout, preview.stderr]) {
    stream.on('data', (chunk) => {
      output = `${output}${chunk}`.slice(-8_000);
    });
  }

  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Astro preview exited before it was ready.\n${output}`);
    try {
      const response = await fetch(`${origin}/`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Preview startup is asynchronous; retry briefly before failing the smoke check.
    }
    await wait(250);
  }
  if (!ready) throw new Error(`Astro preview did not become ready.\n${output}`);

  const homepage = await request(origin, '/', 200);
  if (!/<html\b/i.test(homepage.body) || !/<h1\b/i.test(homepage.body)) {
    fail('/ must return the rendered HTML homepage.');
  }

  for (const path of ['/sitemap-index.xml', '/sitemap-0.xml', '/llms.txt', '/rss.xml']) {
    const result = await request(origin, path, 200);
    if (!result.body.trim()) fail(`${path} returned an empty response.`);
  }

  const customNotFound = await request(origin, '/__discoverability-unknown__/', 404);
  if (!hasCustomNoindex(customNotFound.body)) {
    fail('The trailing-slash 404 response must render the custom noindex,follow document.');
  }

  await request(origin, '/__discoverability-unknown__', 404);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  if (preview) await stop(preview);
}

if (errors.length > 0) {
  console.error(`Discoverability HTTP smoke check failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Discoverability HTTP smoke check passed: public discovery files return 200 and unknown routes return 404.');
