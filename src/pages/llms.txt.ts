import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';
import { absoluteUrl, FEATURED_PROJECT_IDS, latestDate } from '../lib/seo';

export const prerender = true;

const byNewest = <T extends { data: { publishedAt: string } }>(a: T, b: T) =>
  Date.parse(b.data.publishedAt) - Date.parse(a.data.publishedAt);

export const GET: APIRoute = async () => {
  const [projects, posts, media] = await Promise.all([
    getCollection('projects', ({ data }) => !data.draft),
    getCollection('posts', ({ data }) => !data.draft),
    getCollection('media', ({ data }) => !data.draft),
  ]);
  projects.sort(byNewest);
  posts.sort(byNewest);
  media.sort(byNewest);

  const featuredProjects = FEATURED_PROJECT_IDS
    .map((id) => projects.find((entry) => entry.id === id))
    .filter((entry) => entry !== undefined);
  const featuredPosts = posts.filter((entry) => entry.data.featured);
  const publicMedia = media.filter((entry) => entry.data.type !== 'channel');
  const lastUpdated = latestDate([
    profile.updatedAt,
    ...projects.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
    ...posts.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
    ...media.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
  ]);

  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.description}`,
    '',
    `${profile.name} is a ${profile.location}-based AI/ML engineer, product builder, and educator. He builds reliable AI systems and practical products, including Krishi AI, a multilingual farming companion for farmers in India.`,
    '',
    '## Core pages',
    '',
    `- [Home](${absoluteUrl('/')}): Overview of Vivek’s work, writing, and current focus.`,
    `- [About](${absoluteUrl('/about/')}): Biography, roots, values, and interests.`,
    `- [Résumé](${absoluteUrl('/resume/')}): Professional experience, skills, education, and credentials.`,
    `- [Now](${absoluteUrl('/now/')}): Current work, priorities, and aspirations.`,
    `- [Contact](${absoluteUrl('/contact/')}): Verified public channels for conversation.`,
    `- [Work](${absoluteUrl('/work/')}): Projects and case studies.`,
    `- [Writing](${absoluteUrl('/writing/')}): Essays and working ideas about AI, engineering, and building products.`,
    `- [Media](${absoluteUrl('/media/')}): Talks, videos, and public appearances.`,
    '',
    '## Featured projects',
    '',
    ...featuredProjects.map((entry) => `- [${entry.data.title}](${absoluteUrl(`/work/${entry.id}/`)}): ${entry.data.description}`),
    '',
    '## Featured writing',
    '',
    ...featuredPosts.map((entry) => `- [${entry.data.title}](${absoluteUrl(`/writing/${entry.id}/`)}): ${entry.data.description}`),
    '',
    '## Selected media',
    '',
    ...publicMedia.map((entry) => `- [${entry.data.title}](${absoluteUrl(`/media/${entry.id}/`)}): ${entry.data.description}`),
    '',
    '## Feeds and discovery',
    '',
    `- [RSS](${absoluteUrl('/rss.xml')}): Latest writing.`,
    `- [Sitemap index](${absoluteUrl('/sitemap-index.xml')}): Canonical index of public pages.`,
    '',
    `Last substantive update: ${lastUpdated}.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
