import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absoluteUrl, latestDate } from '../lib/seo';
import { profile } from '../data/profile';

export const prerender = true;

export const GET: APIRoute = async () => {
  const [projects, posts, media] = await Promise.all([
    getCollection('projects', ({ data }) => !data.draft),
    getCollection('posts', ({ data }) => !data.draft),
    getCollection('media', ({ data }) => !data.draft),
  ]);
  const lastmod = latestDate([
    profile.updatedAt,
    ...projects.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
    ...posts.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
    ...media.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
  ]);

  return new Response([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <sitemap>',
    `    <loc>${absoluteUrl('/sitemap-0.xml')}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '  </sitemap>',
    '</sitemapindex>',
    '',
  ].join('\n'), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
