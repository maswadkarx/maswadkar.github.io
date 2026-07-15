import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';
import { absoluteUrl, latestDate, normalizeImage, utcDate } from '../lib/seo';

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const mediaData = (post) => {
  const image = normalizeImage(post.data.cover);
  if (!image?.width || !image.height || !image.type) return '';
  const url = absoluteUrl(image.src);
  const title = image.alt || post.data.title;
  const description = image.caption || post.data.description;
  return [
    `<media:content url="${escapeXml(url)}" type="${escapeXml(image.type)}" medium="image" width="${image.width}" height="${image.height}">`,
    `<media:title type="plain">${escapeXml(title)}</media:title>`,
    `<media:description type="plain">${escapeXml(description)}</media:description>`,
    `<media:credit role="author">${escapeXml(image.credit || profile.name)}</media:credit>`,
    '</media:content>',
  ].join('');
};

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => Date.parse(b.data.publishedAt) - Date.parse(a.data.publishedAt),
  );

  return rss({
    title: `${profile.name} — Writing`,
    description: 'Notes and essays from Vivek Maswadkar.',
    site: context.site ?? profile.siteUrl,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      dc: 'http://purl.org/dc/elements/1.1/',
      media: 'http://search.yahoo.com/mrss/',
    },
    customData: [
      '<language>en</language>',
      `<lastBuildDate>${utcDate(latestDate(posts.map((post) => post.data.updatedAt ?? post.data.publishedAt))).toUTCString()}</lastBuildDate>`,
      `<atom:link href="${profile.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
      `<dc:creator>${escapeXml(profile.name)}</dc:creator>`,
    ].join(''),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: utcDate(post.data.publishedAt),
      link: `/writing/${post.id}/`,
      categories: post.data.tags,
      customData: [
        `<dc:creator>${escapeXml(profile.name)}</dc:creator>`,
        `<atom:updated>${utcDate(post.data.updatedAt ?? post.data.publishedAt).toISOString()}</atom:updated>`,
        mediaData(post),
      ].join(''),
    })),
  });
}
