import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => Date.parse(b.data.publishedAt) - Date.parse(a.data.publishedAt),
  );

  return rss({
    title: `${profile.name} — Writing`,
    description: 'Notes and essays from Vivek Maswadkar.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(`${post.data.publishedAt}T00:00:00`),
      link: `/writing/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
