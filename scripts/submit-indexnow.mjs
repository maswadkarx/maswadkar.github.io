#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultOrigin = new URL(process.env.SITE_ORIGIN ?? 'https://resume.maswadkar.com').origin;
const defaultKey = process.env.INDEXNOW_KEY ?? 'aabae933ce6787af2a5016536de1f272';

function optionsFrom(argv) {
  const options = {
    dryRun: false,
    endpoint: process.env.INDEXNOW_ENDPOINT ?? 'https://api.indexnow.org/indexnow',
    key: defaultKey,
    keyLocation: undefined,
    sitemap: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') options.dryRun = true;
    else if (['--endpoint', '--key', '--key-location', '--sitemap'].includes(argument)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value.`);
      options[argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }

  options.keyLocation ??= `${defaultOrigin}/${options.key}.txt`;
  options.sitemap ??= existsSync(resolve('dist/sitemap-0.xml'))
    ? resolve('dist/sitemap-0.xml')
    : `${defaultOrigin}/sitemap-0.xml`;
  return options;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

async function readText(location, attempts = 4) {
  if (!/^https?:\/\//i.test(location)) return readFileSync(resolve(location), 'utf8');
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(location, {
        headers: { 'user-agent': 'Vivek-Maswadkar-Portfolio-IndexNow/1.0' },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) return await response.text();

      const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
      const message = `Could not read sitemap ${location}: HTTP ${response.status}`;
      if (!retryable) throw new Error(message);
      lastError = new Error(message);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && /^Could not read sitemap/.test(error.message) && !/HTTP (?:408|425|429|5\d\d)$/.test(error.message)) {
        throw error;
      }
    }

    if (attempt < attempts) await wait(1_000 * 2 ** (attempt - 1));
  }
  throw lastError ?? new Error(`Could not read sitemap ${location}.`);
}

async function collectSitemapUrls(location, visited = new Set()) {
  if (visited.has(location)) return [];
  visited.add(location);
  if (visited.size > 20) throw new Error('Sitemap recursion limit exceeded.');

  const xml = await readText(location);
  const locations = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) =>
    decodeEntities(match[1].trim()),
  );
  if (/<sitemapindex\b/i.test(xml)) {
    const nested = await Promise.all(locations.map((child) => collectSitemapUrls(child, visited)));
    return nested.flat();
  }
  if (!/<urlset\b/i.test(xml)) throw new Error(`Unsupported sitemap document: ${location}`);
  return locations;
}

function wait(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function submitWithRetry(endpoint, body, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, {
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'user-agent': 'Vivek-Maswadkar-Portfolio-IndexNow/1.0',
        },
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await wait(1_000 * 2 ** (attempt - 1));
      continue;
    }

    const responseText = (await response.text()).slice(0, 500).trim();
    if (response.ok) return response.status;
    const retryable = response.status === 429 || response.status >= 500;
    const message = `IndexNow returned HTTP ${response.status}${responseText ? `: ${responseText}` : ''}`;
    if (!retryable) throw new Error(message);
    lastError = new Error(message);
    if (attempt === attempts) break;
    await wait(1_000 * 2 ** (attempt - 1));
  }
  throw lastError ?? new Error('IndexNow submission failed.');
}

try {
  const options = optionsFrom(process.argv.slice(2));
  if (!/^[a-f\d]{32}$/i.test(options.key)) throw new Error('IndexNow key must be 32 hexadecimal characters.');

  const keyLocation = new URL(options.keyLocation);
  const origin = keyLocation.origin;
  if (keyLocation.pathname !== `/${options.key}.txt`) {
    throw new Error(`IndexNow key location must end with /${options.key}.txt.`);
  }

  const discovered = await collectSitemapUrls(options.sitemap);
  const urlList = [...new Set(discovered)].filter((value) => {
    try {
      const url = new URL(value);
      return url.origin === origin && url.protocol === 'https:' && !/(^|\/)404(?:\/|$)/i.test(url.pathname);
    } catch {
      return false;
    }
  });
  if (urlList.length === 0) throw new Error('No canonical URLs were found in the sitemap.');
  if (urlList.length > 10_000) throw new Error('IndexNow accepts at most 10,000 URLs per request.');

  const body = {
    host: new URL(origin).host,
    key: options.key,
    keyLocation: options.keyLocation,
    urlList,
  };

  if (options.dryRun) {
    console.log(`IndexNow dry run: would submit ${urlList.length} URLs for ${body.host}.`);
    console.log(JSON.stringify(body, null, 2));
  } else {
    const status = await submitWithRetry(options.endpoint, body);
    console.log(`IndexNow accepted ${urlList.length} URLs for ${body.host} (HTTP ${status}).`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
