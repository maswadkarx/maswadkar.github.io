import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const mediaKinds = [
  'screenshot',
  'diagram',
  'photograph',
  'editorial-illustration',
  'synthetic-demo',
] as const;

const mediaProvenance = [
  'user-owned',
  'project-evidence',
  'generated-editorial',
  'synthetic-demo',
] as const;

const focalPoints = ['center', 'top', 'bottom', 'left', 'right'] as const;

const createMediaAssetSchema = <T extends z.ZodTypeAny>(image: () => T) => z.object({
  src: image(),
  alt: z.string().trim().min(1),
  kind: z.enum(mediaKinds),
  caption: z.string().trim().min(1).optional(),
  credit: z.string().trim().min(1).optional(),
  sourceUrl: z.url().optional(),
  focalPoint: z.enum(focalPoints).default('center'),
  provenance: z.enum(mediaProvenance),
}).superRefine((asset, context) => {
  const disclosure = asset.caption?.toLocaleLowerCase('en') ?? '';

  if (asset.kind === 'editorial-illustration') {
    if (asset.provenance !== 'generated-editorial') {
      context.addIssue({
        code: 'custom',
        path: ['provenance'],
        message: 'Editorial illustrations must use generated-editorial provenance.',
      });
    }
    if (!disclosure.includes('editorial illustration')) {
      context.addIssue({
        code: 'custom',
        path: ['caption'],
        message: 'Editorial illustrations require a caption that explicitly says “Editorial illustration”.',
      });
    }
  }

  if (asset.kind === 'synthetic-demo') {
    if (asset.provenance !== 'synthetic-demo') {
      context.addIssue({
        code: 'custom',
        path: ['provenance'],
        message: 'Synthetic demonstrations must use synthetic-demo provenance.',
      });
    }
    if (!disclosure.includes('synthetic')) {
      context.addIssue({
        code: 'custom',
        path: ['caption'],
        message: 'Synthetic demonstrations require a caption that explicitly says “Synthetic”.',
      });
    }
  }
});

const createSocialImageSchema = <T extends z.ZodTypeAny>(image: () => T) => z.object({
  src: image(),
  alt: z.string().trim().min(1),
});

const commonFields = {
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
};

function requirePublishedMedia(
  data: { draft: boolean; cover?: unknown; socialImage?: unknown },
  context: z.RefinementCtx,
) {
  if (data.draft) return;
  for (const field of ['cover', 'socialImage'] as const) {
    if (!data[field]) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} is required for every published detail page.`,
      });
    }
  }
}

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    ...commonFields,
    cover: createMediaAssetSchema(image).optional(),
    socialImage: createSocialImageSchema(image).optional(),
    gallery: z.array(createMediaAssetSchema(image)).default([]),
    role: z.string().optional(),
    status: z.enum(['In progress', 'Complete', 'Maintained', 'Archived']).optional(),
    startedAt: z.string().optional(),
    sourceUrl: z.url().optional(),
    liveUrl: z.url().optional(),
  }).superRefine(requirePublishedMedia),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    ...commonFields,
    cover: createMediaAssetSchema(image).optional(),
    socialImage: createSocialImageSchema(image).optional(),
    gallery: z.array(createMediaAssetSchema(image)).default([]),
    readingTime: z.string().optional(),
    externalUrl: z.url().optional(),
    externalLabel: z.string().optional(),
  }).superRefine(requirePublishedMedia),
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/media' }),
  schema: ({ image }) => z.object({
    ...commonFields,
    type: z.enum(['video', 'talk', 'appearance', 'channel']),
    url: z.url(),
    poster: createMediaAssetSchema(image).optional(),
    socialImage: createSocialImageSchema(image).optional(),
    duration: z.string().regex(/^PT(?:\d+H)?(?:\d+M)?\d+S$/).optional(),
    embedUrl: z.url().optional(),
    videoMetadataVerified: z.boolean().default(false),
  }).superRefine((data, context) => {
    if (!data.draft && data.type !== 'channel') {
      for (const field of ['poster', 'socialImage'] as const) {
        if (!data[field]) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message: `${field} is required for every published media detail page.`,
          });
        }
      }
    }

    if (!data.videoMetadataVerified) return;

    if (data.type === 'channel') {
      context.addIssue({
        code: 'custom',
        path: ['videoMetadataVerified'],
        message: 'Channel entries cannot be published as VideoObject metadata.',
      });
    }

    for (const field of ['poster', 'duration', 'embedUrl'] as const) {
      if (!data[field]) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: `${field} is required when videoMetadataVerified is true.`,
        });
      }
    }
  }),
});

export const collections = { projects, posts, media };
