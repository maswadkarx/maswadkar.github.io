import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const common = {
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(true),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  tags: z.array(z.string()).default([]),
};

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    ...common,
    role: z.string().optional(),
    status: z.enum(['In progress', 'Complete', 'Maintained', 'Archived']).optional(),
    startedAt: z.string().optional(),
    sourceUrl: z.url().optional(),
    liveUrl: z.url().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    ...common,
    readingTime: z.string().optional(),
    externalUrl: z.url().optional(),
    externalLabel: z.string().optional(),
  }),
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/media' }),
  schema: z.object({
    ...common,
    type: z.enum(['video', 'talk', 'appearance', 'channel']),
    url: z.url(),
  }),
});

export const collections = { projects, posts, media };
