#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = resolve(projectRoot, process.argv[2] ?? 'dist');
const siteOrigin = new URL(process.env.SITE_ORIGIN ?? 'https://resume.maswadkar.com').origin;
const personId = `${siteOrigin}/#vivek`;
const errors = [];

function fail(message) {
  errors.push(message);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function decodeEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
    if (body[0] === '#') {
      const hexadecimal = body[1]?.toLowerCase() === 'x';
      const number = Number.parseInt(body.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }

    return named[body.toLowerCase()] ?? entity;
  });
}

function plainText(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function attribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? '') : undefined;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

function paired(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, 'gi'))];
}

function objectsIn(value) {
  if (Array.isArray(value)) return value.flatMap(objectsIn);
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(objectsIn)];
}

function dateKey(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString().slice(0, 10);
}

function hasToken(value, token) {
  return (value ?? '').split(/[\s,]+/).some((part) => part.toLowerCase() === token.toLowerCase());
}

function routeForFile(file) {
  const local = relative(distRoot, file).split(sep).join('/');
  if (local === 'index.html') return '/';
  if (local.endsWith('/index.html')) return `/${local.slice(0, -'index.html'.length)}`;
  return `/${local}`;
}

function localFileForUrl(input) {
  let url;
  try {
    url = input instanceof URL ? input : new URL(input, siteOrigin);
  } catch {
    return undefined;
  }

  if (url.origin !== siteOrigin) return undefined;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = url.pathname;
  }

  const localPath = pathname.replace(/^\/+/, '');
  const candidates = [];
  if (pathname.endsWith('/')) candidates.push(join(distRoot, localPath, 'index.html'));
  else {
    candidates.push(join(distRoot, localPath));
    if (!extname(pathname)) candidates.push(join(distRoot, localPath, 'index.html'));
  }

  return candidates.find((candidate) => {
    const absolute = resolve(candidate);
    return absolute.startsWith(`${distRoot}${sep}`) || absolute === distRoot
      ? existsSync(absolute) && statSync(absolute).isFile()
      : false;
  });
}

function xmlLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeEntities(match[1].trim()));
}

function valuesAreUnique(records, key, label) {
  const seen = new Map();
  for (const record of records) {
    const value = record[key];
    if (!value) continue;
    const previous = seen.get(value);
    if (previous) fail(`${label} is duplicated by ${previous} and ${record.route}: ${value}`);
    else seen.set(value, record.route);
  }
}

if (!existsSync(distRoot)) {
  console.error(`Discoverability check requires a production build at ${distRoot}. Run npm run build first.`);
  process.exit(1);
}

const htmlFiles = walk(distRoot).filter((file) => file.endsWith('.html'));
const pages = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = routeForFile(file);
  const isNotFound = relative(distRoot, file).split(sep).join('/') === '404.html';
  const titleMatches = paired(html, 'title');
  const h1Matches = paired(html, 'h1');
  const descriptionTags = tags(html, 'meta').filter(
    (tag) => attribute(tag, 'name')?.toLowerCase() === 'description',
  );
  const canonicalTags = tags(html, 'link').filter((tag) => hasToken(attribute(tag, 'rel'), 'canonical'));
  const propertyMeta = (property) => tags(html, 'meta').filter(
    (tag) => attribute(tag, 'property')?.toLowerCase() === property.toLowerCase(),
  );
  const robotsTags = tags(html, 'meta').filter(
    (tag) => attribute(tag, 'name')?.toLowerCase() === 'robots',
  );
  const robots = robotsTags.map((tag) => attribute(tag, 'content') ?? '').join(',');

  if (isNotFound) {
    if (robotsTags.length !== 1 || !hasToken(robots, 'noindex') || !hasToken(robots, 'follow')) {
      fail('404.html must contain exactly one robots meta tag with noindex,follow.');
    }
    continue;
  }

  if (hasToken(robots, 'noindex')) fail(`${route} is public HTML but declares noindex.`);
  if (titleMatches.length !== 1 || !plainText(titleMatches[0]?.[2] ?? '')) {
    fail(`${route} must have exactly one non-empty <title>.`);
  }
  if (descriptionTags.length !== 1 || !attribute(descriptionTags[0], 'content')?.trim()) {
    fail(`${route} must have exactly one non-empty meta description.`);
  }
  if (canonicalTags.length !== 1) fail(`${route} must have exactly one canonical link.`);
  if (h1Matches.length !== 1 || !plainText(h1Matches[0]?.[2] ?? '')) {
    fail(`${route} must have exactly one non-empty <h1>.`);
  }

  const socialProperties = [
    'og:image',
    'og:image:alt',
    'og:image:width',
    'og:image:height',
    'og:image:type',
  ];
  for (const property of socialProperties) {
    const matches = propertyMeta(property);
    if (matches.length !== 1 || !attribute(matches[0], 'content')?.trim()) {
      fail(`${route} must have exactly one non-empty ${property} meta tag.`);
    }
  }
  const imageWidth = Number(attribute(propertyMeta('og:image:width')[0] ?? '', 'content'));
  const imageHeight = Number(attribute(propertyMeta('og:image:height')[0] ?? '', 'content'));
  const imageType = attribute(propertyMeta('og:image:type')[0] ?? '', 'content');
  if (!Number.isInteger(imageWidth) || imageWidth <= 0 || !Number.isInteger(imageHeight) || imageHeight <= 0) {
    fail(`${route} social image dimensions must be positive integers.`);
  }
  if (!/^image\/[a-z0-9.+-]+$/i.test(imageType ?? '')) fail(`${route} social image type must be a MIME image type.`);
  const socialImage = attribute(propertyMeta('og:image')[0] ?? '', 'content');
  if (socialImage) {
    try {
      const imageUrl = new URL(socialImage);
      if (imageUrl.origin === siteOrigin && !localFileForUrl(imageUrl)) {
        fail(`${route} social image does not resolve to a built asset: ${socialImage}`);
      }
    } catch {
      fail(`${route} has an invalid social image URL: ${socialImage}`);
    }
  }
  if (route === '/') {
    if (imageWidth !== 1200 || imageHeight !== 630 || imageType !== 'image/png') {
      fail('Homepage must expose the branded 1200x630 PNG social image.');
    }
    try {
      if (new URL(socialImage).pathname !== '/images/og/default.png') {
        fail('Homepage must use /images/og/default.png as its social image.');
      }
    } catch {
      // The invalid URL error is reported above.
    }
  }

  const iconLinks = tags(html, 'link').filter((tag) => hasToken(attribute(tag, 'rel'), 'icon'));
  const appleLinks = tags(html, 'link').filter((tag) => hasToken(attribute(tag, 'rel'), 'apple-touch-icon'));
  const manifestLinks = tags(html, 'link').filter((tag) => hasToken(attribute(tag, 'rel'), 'manifest'));
  for (const [label, matches] of [['favicon', iconLinks], ['Apple touch icon', appleLinks], ['manifest', manifestLinks]]) {
    if (matches.length !== 1) fail(`${route} must link exactly one ${label}.`);
    const href = matches.length === 1 ? attribute(matches[0], 'href') : undefined;
    if (href && !localFileForUrl(href)) fail(`${route} ${label} link is broken: ${href}`);
  }

  const canonical = canonicalTags.length === 1 ? attribute(canonicalTags[0], 'href') : undefined;
  if (canonical) {
    try {
      const canonicalUrl = new URL(canonical);
      if (canonicalUrl.origin !== siteOrigin) fail(`${route} canonical must use ${siteOrigin}.`);
      if (canonicalUrl.hash || canonicalUrl.search) fail(`${route} canonical must not contain a query or fragment.`);
      if (localFileForUrl(canonicalUrl) !== file) {
        fail(`${route} canonical does not resolve back to its built HTML file: ${canonical}`);
      }
    } catch {
      fail(`${route} has an invalid canonical URL: ${canonical}`);
    }
  }

  const jsonScripts = paired(html, 'script').filter(
    (match) => attribute(`<script${match[1]}>`, 'type')?.toLowerCase() === 'application/ld+json',
  );
  if (jsonScripts.length === 0) fail(`${route} must include JSON-LD.`);
  let referencesPerson = false;
  let hasVideoObject = false;
  const imageObjects = [];
  const primaryImageReferences = new Set();
  const modifiedDates = new Set();
  for (const match of jsonScripts) {
    try {
      const value = JSON.parse(match[2].trim());
      const serialized = JSON.stringify(value);
      if (!serialized.includes('schema.org')) fail(`${route} JSON-LD is missing a schema.org context.`);
      if (serialized.includes(personId)) referencesPerson = true;
      for (const node of objectsIn(value)) {
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (types.includes('VideoObject')) hasVideoObject = true;
        if (types.includes('ImageObject')) imageObjects.push(node);
        if (
          types.some((type) => type === 'WebPage' || type === 'ProfilePage')
          && node.primaryImageOfPage
          && typeof node.primaryImageOfPage === 'object'
          && typeof node.primaryImageOfPage['@id'] === 'string'
        ) {
          primaryImageReferences.add(node.primaryImageOfPage['@id']);
        }
        if (types.some((type) => type === 'WebPage' || type === 'ProfilePage') && typeof node.dateModified === 'string') {
          const normalized = dateKey(node.dateModified);
          if (normalized) modifiedDates.add(normalized);
          else fail(`${route} has an invalid WebPage dateModified value: ${node.dateModified}`);
        }
      }
    } catch (error) {
      fail(`${route} has invalid JSON-LD: ${error.message}`);
    }
  }
  if (!referencesPerson) fail(`${route} JSON-LD must reference the stable Person ID ${personId}.`);
  if (modifiedDates.size !== 1) {
    fail(`${route} JSON-LD must expose exactly one consistent WebPage/ProfilePage dateModified value.`);
  }

  const isMediaDetail = /^\/(?:work|writing|media)\/[^/]+\/$/.test(route);
  let primaryImage;
  if (isMediaDetail && canonical) {
    const primaryImageId = `${canonical}#primaryimage`;
    primaryImage = imageObjects.find((node) => node['@id'] === primaryImageId);
    if (!primaryImage) fail(`${route} JSON-LD must define its page-specific primary ImageObject.`);
    if (!primaryImageReferences.has(primaryImageId)) {
      fail(`${route} WebPage JSON-LD must reference ${primaryImageId} as primaryImageOfPage.`);
    }
    if (primaryImage) {
      const contentUrl = typeof primaryImage.contentUrl === 'string' ? primaryImage.contentUrl : undefined;
      if (!contentUrl || !localFileForUrl(contentUrl)) {
        fail(`${route} primary ImageObject must resolve to a built local image.`);
      }
      if (!Number.isInteger(primaryImage.width) || primaryImage.width <= 0
        || !Number.isInteger(primaryImage.height) || primaryImage.height <= 0) {
        fail(`${route} primary ImageObject must expose positive intrinsic dimensions.`);
      }
      if (!/^image\/[a-z0-9.+-]+$/i.test(primaryImage.encodingFormat ?? '')) {
        fail(`${route} primary ImageObject must expose a valid image MIME type.`);
      }
      if (typeof primaryImage.caption !== 'string' || !primaryImage.caption.trim()) {
        fail(`${route} primary ImageObject must expose an accurate caption or alt description.`);
      }
    }
    if (imageWidth !== 1200 || imageHeight !== 630) {
      fail(`${route} must expose a dedicated 1200x630 social image.`);
    }
  }

  pages.push({
    canonical,
    description: descriptionTags.length === 1 ? attribute(descriptionTags[0], 'content')?.trim() : undefined,
    file,
    html,
    modifiedAt: [...modifiedDates][0],
    hasVideoObject,
    primaryImage: typeof primaryImage?.contentUrl === 'string' ? primaryImage.contentUrl : undefined,
    route,
    socialImage,
    title: titleMatches.length === 1 ? plainText(titleMatches[0][2]) : undefined,
  });
}

valuesAreUnique(pages, 'title', 'Page title');
valuesAreUnique(pages, 'description', 'Meta description');
valuesAreUnique(pages, 'canonical', 'Canonical URL');

const mediaDetailPages = pages.filter((page) => /^\/(?:work|writing|media)\/[^/]+\/$/.test(page.route));
valuesAreUnique(mediaDetailPages, 'primaryImage', 'Primary content image');
valuesAreUnique(mediaDetailPages, 'socialImage', 'Detail-page social image');

for (const page of pages.filter((candidate) => /^\/media\/[^/]+\/$/.test(candidate.route))) {
  for (const tag of tags(page.html, 'img')) {
    const src = attribute(tag, 'src');
    if (!src || src.startsWith('data:')) continue;
    try {
      const url = new URL(src, page.canonical ?? siteOrigin);
      if (url.origin !== siteOrigin) {
        fail(`${page.route} requests an external image before video playback: ${src}`);
      }
    } catch {
      fail(`${page.route} has an invalid image source: ${src}`);
    }
  }
  for (const tag of tags(page.html, 'iframe')) {
    if (attribute(tag, 'src')) fail(`${page.route} must not render a third-party iframe before Play.`);
  }
}

const sitemapIndexPath = join(distRoot, 'sitemap-index.xml');
const sitemapPath = join(distRoot, 'sitemap-0.xml');
let sitemapIndexLastmod;

for (const requiredFile of [
  sitemapIndexPath,
  sitemapPath,
  join(distRoot, 'llms.txt'),
  join(distRoot, 'robots.txt'),
  join(distRoot, 'rss.xml'),
]) {
  if (!existsSync(requiredFile)) fail(`Missing required discovery file: ${relative(distRoot, requiredFile)}`);
}

if (existsSync(sitemapIndexPath)) {
  const xml = readFileSync(sitemapIndexPath, 'utf8');
  if (!/<sitemapindex\b/i.test(xml) || !/<\/sitemapindex>/i.test(xml)) {
    fail('sitemap-index.xml must contain a sitemapindex root element.');
  }
  const locations = xmlLocations(xml);
  const indexModified = [...xml.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/gi)].map((match) => match[1].trim());
  if (indexModified.length !== 1 || !dateKey(indexModified[0])) {
    fail('sitemap-index.xml must contain exactly one valid lastmod value.');
  } else {
    sitemapIndexLastmod = dateKey(indexModified[0]);
  }
  if (locations.length === 0) fail('sitemap-index.xml must reference at least one sitemap.');
  for (const location of locations) {
    const file = localFileForUrl(location);
    if (!file || !file.endsWith('.xml')) fail(`Sitemap index URL does not resolve to built XML: ${location}`);
  }
  if (
    !locations.some((location) => {
      try {
        return new URL(location, siteOrigin).pathname === '/sitemap-0.xml';
      } catch {
        return false;
      }
    })
  ) {
    fail('sitemap-index.xml must reference /sitemap-0.xml.');
  }
}

let sitemapUrls = [];
const sitemapLastmods = new Map();
const sitemapImages = new Map();
const sitemapVideos = new Map();
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, 'utf8');
  if (!/<urlset\b/i.test(xml) || !/<\/urlset>/i.test(xml)) {
    fail('sitemap-0.xml must contain a urlset root element.');
  }
  if (!/xmlns:image=["']http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1["']/i.test(xml)) {
    fail('sitemap-0.xml must declare the Google image sitemap namespace.');
  }
  if (!/xmlns:video=["']http:\/\/www\.google\.com\/schemas\/sitemap-video\/1\.1["']/i.test(xml)) {
    fail('sitemap-0.xml must declare the Google video sitemap namespace.');
  }
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)];
  if (entries.length === 0) fail('sitemap-0.xml must contain at least one URL entry.');

  sitemapUrls = entries.flatMap((entry, index) => {
    const locations = xmlLocations(entry[1]);
    const modified = [...entry[1].matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/gi)].map((match) => match[1].trim());
    if (locations.length !== 1) {
      fail(`Sitemap entry ${index + 1} must have exactly one loc.`);
      return [];
    }
    if (modified.length !== 1 || Number.isNaN(Date.parse(modified[0]))) {
      fail(`Sitemap entry ${locations[0]} must have one valid lastmod value.`);
    } else if (Date.parse(modified[0]) > Date.now() + 86_400_000) {
      fail(`Sitemap lastmod must not be in the future: ${locations[0]} (${modified[0]}).`);
    } else if (locations.length === 1) {
      sitemapLastmods.set(locations[0], dateKey(modified[0]));
    }

    if (locations.length === 1) {
      const imageBlocks = [...entry[1].matchAll(/<image:image>([\s\S]*?)<\/image:image>/gi)];
      const images = imageBlocks.flatMap((image, imageIndex) => {
        const imageLocations = [...image[1].matchAll(/<image:loc>([\s\S]*?)<\/image:loc>/gi)]
          .map((match) => decodeEntities(match[1].trim()));
        const imageTitles = [...image[1].matchAll(/<image:title>([\s\S]*?)<\/image:title>/gi)]
          .map((match) => plainText(match[1]));
        if (imageLocations.length !== 1) {
          fail(`Image sitemap entry ${locations[0]} image ${imageIndex + 1} must have exactly one image:loc.`);
          return [];
        }
        if (imageTitles.length !== 1 || !imageTitles[0]) {
          fail(`Image sitemap entry ${imageLocations[0]} must have one non-empty image:title.`);
        }
        if (!localFileForUrl(imageLocations[0])) {
          fail(`Image sitemap URL does not resolve to a built local asset: ${imageLocations[0]}`);
        }
        return imageLocations;
      });
      sitemapImages.set(locations[0], images);

      const videoBlocks = [...entry[1].matchAll(/<video:video>([\s\S]*?)<\/video:video>/gi)];
      const videos = videoBlocks.map((video, videoIndex) => {
        const one = (name) => [...video[1].matchAll(new RegExp(`<video:${name}\\b[^>]*>([\\s\\S]*?)<\\/video:${name}>`, 'gi'))]
          .map((match) => decodeEntities(plainText(match[1])));
        const thumbnails = one('thumbnail_loc');
        const titles = one('title');
        const descriptions = one('description');
        const players = one('player_loc');
        const published = one('publication_date');
        const durations = one('duration');
        if (thumbnails.length !== 1 || !localFileForUrl(thumbnails[0])) {
          fail(`Video sitemap entry ${locations[0]} video ${videoIndex + 1} must use one built local thumbnail.`);
        }
        if (titles.length !== 1 || !titles[0]) fail(`Video sitemap entry ${locations[0]} must have one title.`);
        if (descriptions.length !== 1 || !descriptions[0]) fail(`Video sitemap entry ${locations[0]} must have one description.`);
        if (players.length !== 1) fail(`Video sitemap entry ${locations[0]} must have one player URL.`);
        else {
          try { new URL(players[0]); } catch { fail(`Video sitemap entry ${locations[0]} has an invalid player URL.`); }
        }
        if (published.length !== 1 || Number.isNaN(Date.parse(published[0]))) {
          fail(`Video sitemap entry ${locations[0]} must have one publication date.`);
        }
        if (durations.length > 1 || (durations[0] && (!Number.isInteger(Number(durations[0])) || Number(durations[0]) <= 0))) {
          fail(`Video sitemap entry ${locations[0]} has an invalid duration.`);
        }
        return { thumbnail: thumbnails[0] };
      });
      sitemapVideos.set(locations[0], videos);
    }
    return locations;
  });

  const seen = new Set();
  for (const location of sitemapUrls) {
    if (seen.has(location)) fail(`Sitemap URL is duplicated: ${location}`);
    seen.add(location);
    let url;
    try {
      url = new URL(location);
    } catch {
      fail(`Sitemap has an invalid absolute URL: ${location}`);
      continue;
    }
    if (url.origin !== siteOrigin) fail(`Sitemap URL must use ${siteOrigin}: ${location}`);
    if (/(^|\/)404(?:\/|$)/i.test(url.pathname) || /(^|\/)drafts?(?:\/|$)/i.test(url.pathname)) {
      fail(`404 and draft-like routes must not be in the sitemap: ${location}`);
    }
    const file = localFileForUrl(url);
    if (!file || !file.endsWith('.html')) fail(`Sitemap URL does not resolve to built HTML: ${location}`);
    else {
      const page = pages.find((candidate) => candidate.file === file);
      if (!page) fail(`Sitemap includes non-indexable HTML: ${location}`);
      else if (page.canonical !== location) fail(`Sitemap URL differs from page canonical: ${location}`);
      else if (page.modifiedAt !== sitemapLastmods.get(location)) {
        fail(`Sitemap lastmod for ${location} must match its WebPage dateModified (${page.modifiedAt}).`);
      }
    }
  }

  const sitemapSet = new Set(sitemapUrls);
  for (const page of pages) {
    if (page.canonical && !sitemapSet.has(page.canonical)) fail(`${page.route} is missing from sitemap-0.xml.`);
  }

  for (const page of mediaDetailPages) {
    const images = sitemapImages.get(page.canonical) ?? [];
    if (images.length === 0) fail(`${page.route} must have at least one image sitemap entry.`);
    const videos = sitemapVideos.get(page.canonical) ?? [];
    if (page.hasVideoObject && videos.length !== 1) {
      fail(`${page.route} VideoObject must have exactly one matching video sitemap entry.`);
    }
    if (!page.hasVideoObject && videos.length > 0) {
      fail(`${page.route} must not publish video sitemap metadata without a verified VideoObject.`);
    }
  }

  const latestSitemapDate = [...sitemapLastmods.values()].filter(Boolean).sort().at(-1);
  if (latestSitemapDate && sitemapIndexLastmod !== latestSitemapDate) {
    fail(`Sitemap index lastmod must match the latest child URL lastmod (${latestSitemapDate}).`);
  }
}

const rssPath = join(distRoot, 'rss.xml');
if (existsSync(rssPath)) {
  const rss = readFileSync(rssPath, 'utf8');
  if (!/<rss\b/i.test(rss) || !/<channel>/i.test(rss)) fail('rss.xml must contain an RSS channel.');
  if (!/xmlns:media=["']http:\/\/search\.yahoo\.com\/mrss\/["']/i.test(rss)) {
    fail('rss.xml must declare the Media RSS namespace.');
  }
  const lastBuildDates = [...rss.matchAll(/<lastBuildDate>([\s\S]*?)<\/lastBuildDate>/gi)].map((match) => match[1].trim());
  if (lastBuildDates.length !== 1 || Number.isNaN(Date.parse(lastBuildDates[0])) || !/GMT$/i.test(lastBuildDates[0])) {
    fail('rss.xml must contain exactly one UTC lastBuildDate.');
  }
  if (!/<dc:creator>[^<]+<\/dc:creator>/i.test(rss)) fail('rss.xml channel must identify its author.');
  const rssItems = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  if (rssItems.length === 0) fail('rss.xml must contain at least one writing item.');
  const rssMediaUrls = new Set();
  for (const [index, match] of rssItems.entries()) {
    const item = match[1];
    const links = [...item.matchAll(/<link>([\s\S]*?)<\/link>/gi)].map((link) => decodeEntities(link[1].trim()));
    const published = [...item.matchAll(/<pubDate>([\s\S]*?)<\/pubDate>/gi)].map((date) => date[1].trim());
    const modified = [...item.matchAll(/<atom:updated>([\s\S]*?)<\/atom:updated>/gi)].map((date) => date[1].trim());
    if (links.length !== 1 || !localFileForUrl(links[0])) fail(`RSS item ${index + 1} must link to a built writing page.`);
    if (published.length !== 1 || Number.isNaN(Date.parse(published[0])) || !/GMT$/i.test(published[0])) {
      fail(`RSS item ${index + 1} must contain one UTC pubDate.`);
    }
    if (modified.length !== 1 || Number.isNaN(Date.parse(modified[0])) || !/Z$/i.test(modified[0])) {
      fail(`RSS item ${index + 1} must contain one UTC atom:updated value.`);
    }
    if (!/<dc:creator>[^<]+<\/dc:creator>/i.test(item)) fail(`RSS item ${index + 1} must identify its author.`);
    const mediaContent = [...item.matchAll(/<media:content\b([^>]*)>([\s\S]*?)<\/media:content>/gi)];
    if (mediaContent.length !== 1) {
      fail(`RSS item ${index + 1} must contain exactly one image media:content enclosure.`);
    } else {
      const opening = `<media:content${mediaContent[0][1]}>`;
      const url = attribute(opening, 'url');
      const type = attribute(opening, 'type');
      const medium = attribute(opening, 'medium');
      const width = Number(attribute(opening, 'width'));
      const height = Number(attribute(opening, 'height'));
      if (!url || !localFileForUrl(url)) fail(`RSS item ${index + 1} media enclosure must resolve to a built local asset.`);
      if (url && rssMediaUrls.has(url)) fail(`RSS media enclosure is duplicated: ${url}`);
      if (url) rssMediaUrls.add(url);
      if (medium !== 'image' || !/^image\/[a-z0-9.+-]+$/i.test(type ?? '')) {
        fail(`RSS item ${index + 1} media enclosure must declare an image MIME type.`);
      }
      if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
        fail(`RSS item ${index + 1} media enclosure must declare positive intrinsic dimensions.`);
      }
      if (!/<media:title\b[^>]*>[^<]+<\/media:title>/i.test(mediaContent[0][2])) {
        fail(`RSS item ${index + 1} media enclosure must have a title.`);
      }
      if (!/<media:description\b[^>]*>[^<]+<\/media:description>/i.test(mediaContent[0][2])) {
        fail(`RSS item ${index + 1} media enclosure must have a description.`);
      }
    }
  }
}

const llmsPath = join(distRoot, 'llms.txt');
if (existsSync(llmsPath)) {
  const llms = readFileSync(llmsPath, 'utf8');
  const urls = [...llms.matchAll(/https?:\/\/[^\s<>()\[\]{}"']+/gi)].map((match) =>
    match[0].replace(/[.,;:!?]+$/, ''),
  );
  const expectedPaths = [
    '/',
    '/about/',
    '/resume/',
    '/now/',
    '/contact/',
    '/work/',
    '/writing/',
    '/media/',
    '/rss.xml',
    '/sitemap-index.xml',
  ];
  const internalUrls = urls.filter((value) => {
    try {
      return new URL(value).origin === siteOrigin;
    } catch {
      return false;
    }
  });
  const internalPaths = new Set(internalUrls.map((value) => new URL(value).pathname));
  for (const pathname of expectedPaths) {
    if (!internalPaths.has(pathname)) fail(`llms.txt must link to ${siteOrigin}${pathname}`);
  }
  for (const value of internalUrls) {
    if (!localFileForUrl(value)) fail(`llms.txt has a broken internal URL: ${value}`);
  }
}

for (const page of pages) {
  const base = page.canonical ? new URL(page.canonical) : new URL(page.route, siteOrigin);
  const links = paired(page.html, 'a');
  for (const link of links) {
    const href = attribute(`<a${link[1]}>`, 'href');
    if (!href || /^(?:mailto|tel|javascript|data):/i.test(href)) continue;
    let target;
    try {
      target = new URL(href, base);
    } catch {
      fail(`${page.route} has an invalid link: ${href}`);
      continue;
    }
    if (target.origin !== siteOrigin) continue;
    const targetFile = localFileForUrl(target);
    if (!targetFile) {
      fail(`${page.route} links to a missing internal destination: ${href}`);
      continue;
    }
    if (target.hash && targetFile.endsWith('.html')) {
      let fragment;
      try {
        fragment = decodeURIComponent(target.hash.slice(1));
      } catch {
        fragment = target.hash.slice(1);
      }
      const targetHtml = readFileSync(targetFile, 'utf8');
      const destinations = new Set(
        tags(targetHtml, '[a-z][a-z0-9:-]*').flatMap((tag) =>
          [attribute(tag, 'id'), attribute(tag, 'name')].filter(Boolean),
        ),
      );
      if (!destinations.has(fragment)) fail(`${page.route} links to a missing fragment: ${href}`);
    }
  }
}

const robotsPath = join(distRoot, 'robots.txt');
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf8');
  const directives = robots
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean);
  if (!directives.some((line) => /^user-agent:\s*\*\s*$/i.test(line))) {
    fail('robots.txt must contain User-agent: *.');
  }
  if (!directives.some((line) => /^allow:\s*\/\s*$/i.test(line))) {
    fail('robots.txt must contain Allow: /.');
  }
  if (directives.some((line) => /^disallow:\s*\S+/i.test(line))) {
    fail('robots.txt must not disallow any crawler or path.');
  }
  if (!directives.some((line) => /^sitemap:\s*https:\/\/resume\.maswadkar\.com\/sitemap-index\.xml\s*$/i.test(line))) {
    fail('robots.txt must advertise the canonical sitemap index.');
  }
}

const indexNowFiles = readdirSync(distRoot).filter((name) => /^[a-f\d]{32}\.txt$/i.test(name));
if (indexNowFiles.length !== 1) fail('dist must contain exactly one 32-character IndexNow key file.');
for (const name of indexNowFiles) {
  const key = name.slice(0, -4);
  if (readFileSync(join(distRoot, name), 'utf8').trim() !== key) {
    fail(`IndexNow key file content must match its filename: ${name}`);
  }
}

if (errors.length > 0) {
  console.error(`Discoverability check failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Discoverability check passed: ${pages.length} indexable HTML pages, ${sitemapUrls.length} sitemap URLs, valid JSON-LD, llms.txt, crawler policy, and internal links.`,
);
