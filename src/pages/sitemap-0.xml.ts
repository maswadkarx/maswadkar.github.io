import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import nowImage from '../assets/media/personal/now-current-work.webp';
import portraitImage from '../assets/media/personal/vivek-maswadkar-portrait.webp';
import { profile } from '../data/profile';
import {
  absoluteUrl,
  FEATURED_PROJECT_IDS,
  latestDate,
  normalizeImage,
  type ImageInput,
} from '../lib/seo';

export const prerender = true;

type SitemapEntry = {
  path: string;
  lastmod: string;
  images?: SitemapImage[];
  video?: SitemapVideo;
};

type SitemapImage = {
  src: string;
  alt: string;
  caption?: string;
};

type SitemapVideo = {
  thumbnail: string;
  title: string;
  description: string;
  playerUrl: string;
  duration?: number;
  publishedAt: string;
};

type MediaBearingData = {
  title: string;
  description: string;
  publishedAt: string;
  cover?: ImageInput;
  gallery?: ImageInput[];
  poster?: ImageInput;
  duration?: string;
  embedUrl?: string;
  videoMetadataVerified?: boolean;
};

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const imageEntry = (input: ImageInput | undefined, fallbackAlt: string): SitemapImage | undefined => {
  const image = normalizeImage(input);
  if (!image) return undefined;
  return {
    src: absoluteUrl(image.src),
    alt: image.alt || fallbackAlt,
    caption: image.caption,
  };
};

const contentImages = (data: MediaBearingData): SitemapImage[] => {
  const images = [
    imageEntry(data.cover, data.title),
    ...(data.gallery ?? []).map((asset) => imageEntry(asset, data.title)),
  ].filter((image): image is SitemapImage => Boolean(image));
  const seen = new Set<string>();
  return images.filter((image) => !seen.has(image.src) && seen.add(image.src));
};

const isoDurationSeconds = (duration?: string): number | undefined => {
  if (!duration) return undefined;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(\d+)S$/);
  if (!match) return undefined;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3]);
};

const renderImage = (image: SitemapImage) => [
  '    <image:image>',
  `      <image:loc>${escapeXml(image.src)}</image:loc>`,
  `      <image:title>${escapeXml(image.alt)}</image:title>`,
  ...(image.caption ? [`      <image:caption>${escapeXml(image.caption)}</image:caption>`] : []),
  '    </image:image>',
].join('\n');

const renderVideo = (video: SitemapVideo) => [
  '    <video:video>',
  `      <video:thumbnail_loc>${escapeXml(video.thumbnail)}</video:thumbnail_loc>`,
  `      <video:title>${escapeXml(video.title)}</video:title>`,
  `      <video:description>${escapeXml(video.description)}</video:description>`,
  `      <video:player_loc allow_embed="yes">${escapeXml(video.playerUrl)}</video:player_loc>`,
  ...(video.duration ? [`      <video:duration>${video.duration}</video:duration>`] : []),
  `      <video:publication_date>${escapeXml(video.publishedAt)}</video:publication_date>`,
  '    </video:video>',
].join('\n');

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
    {
      path: '/about/',
      lastmod: profile.updatedAt,
      images: [imageEntry({ src: portraitImage, alt: 'Portrait of Vivek Maswadkar' }, profile.name)!],
    },
    { path: '/contact/', lastmod: profile.updatedAt },
    { path: '/media/', lastmod: mediaLastmod },
    {
      path: '/now/',
      lastmod: profile.updatedAt,
      images: [imageEntry({ src: nowImage, alt: 'Current work across Krishi AI, agent workflows, and public teaching' }, 'Current work')!],
    },
    { path: '/resume/', lastmod: profile.updatedAt },
    { path: '/work/', lastmod: projectLastmod },
    { path: '/writing/', lastmod: postLastmod },
    ...projects.map((entry) => ({
      path: `/work/${entry.id}/`,
      lastmod: entry.data.updatedAt ?? entry.data.publishedAt,
      images: contentImages(entry.data as unknown as MediaBearingData),
    })),
    ...posts.map((entry) => ({
      path: `/writing/${entry.id}/`,
      lastmod: entry.data.updatedAt ?? entry.data.publishedAt,
      images: contentImages(entry.data as unknown as MediaBearingData),
    })),
    ...media
      .filter((entry) => entry.data.type !== 'channel')
      .map((entry) => {
        const data = entry.data as unknown as MediaBearingData;
        const poster = imageEntry(data.poster, data.title);
        const video = data.videoMetadataVerified && poster && data.embedUrl
          ? {
              thumbnail: poster.src,
              title: data.title,
              description: data.description,
              playerUrl: data.embedUrl,
              duration: isoDurationSeconds(data.duration),
              publishedAt: data.publishedAt,
            }
          : undefined;
        return {
          path: `/media/${entry.id}/`,
          lastmod: entry.data.updatedAt ?? entry.data.publishedAt,
          images: poster ? [poster] : [],
          video,
        };
      }),
  ].sort((a, b) => a.path.localeCompare(b.path));

  const urls = entries.map(({ path, lastmod, images, video }) => [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(path))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    ...(images ?? []).map(renderImage),
    ...(video ? [renderVideo(video)] : []),
    '  </url>',
  ].join('\n')).join('\n');

  return new Response([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    urls,
    '</urlset>',
    '',
  ].join('\n'), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
