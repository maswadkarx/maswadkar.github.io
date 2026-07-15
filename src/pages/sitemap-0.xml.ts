import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';
import { absoluteUrl, FEATURED_PROJECT_IDS, latestDate } from '../lib/seo';

export const prerender = true;

type SitemapEntry = {
  path: string;
  lastmod: string;
};

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const GET: APIRoute = async () => {
  const [projects, posts, media] = await Promise.all([
    getCollection('projects', ({ data }) => !data.draft),
    getCollection('posts', ({ data }) => !data.draft),
    getCollection('media', ({ data }) => !data.draft),
  ]);

  const projectLastmod = latestDate(projects.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt));
  const postLastmod = latestDate(posts.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt));
  const mediaLastmod = latestDate(media.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt));
  const featuredProjectIds = new Set<string>(FEATURED_PROJECT_IDS);
  const homeProjects = projects.filter((entry) => featuredProjectIds.has(entry.id));
  const homePosts = [...posts]
    .sort((a, b) => Date.parse(b.data.publishedAt) - Date.parse(a.data.publishedAt))
    .slice(0, 3);
  const homeLastmod = latestDate([
    profile.updatedAt,
    ...homeProjects.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
    ...homePosts.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
  ]);

  const entries: SitemapEntry[] = [
    { path: '/', lastmod: homeLastmod },
    { path: '/about/', lastmod: profile.updatedAt },
    { path: '/contact/', lastmod: profile.updatedAt },
    { path: '/media/', lastmod: mediaLastmod },
    { path: '/now/', lastmod: profile.updatedAt },
    { path: '/resume/', lastmod: profile.updatedAt },
    { path: '/work/', lastmod: projectLastmod },
    { path: '/writing/', lastmod: postLastmod },
    ...projects.map((entry) => ({
      path: `/work/${entry.id}/`,
      lastmod: entry.data.updatedAt ?? entry.data.publishedAt,
    })),
    ...posts.map((entry) => ({
      path: `/writing/${entry.id}/`,
      lastmod: entry.data.updatedAt ?? entry.data.publishedAt,
    })),
    ...media
      .filter((entry) => entry.data.type !== 'channel')
      .map((entry) => ({
        path: `/media/${entry.id}/`,
        lastmod: entry.data.updatedAt ?? entry.data.publishedAt,
      })),
  ].sort((a, b) => a.path.localeCompare(b.path));

  const urls = entries.map(({ path, lastmod }) => [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(path))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '  </url>',
  ].join('\n')).join('\n');

  return new Response([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n'), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
