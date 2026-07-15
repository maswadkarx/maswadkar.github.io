import { profile } from '../data/profile';
import portraitImage from '../assets/media/personal/vivek-maswadkar-portrait.webp';

export type JsonLdNode = Record<string, unknown>;
export type JsonLdSchema = JsonLdNode | JsonLdNode[];

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type SocialImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  type: string;
};

export type ImageMetadataLike = {
  src: string;
  width: number;
  height: number;
  format: string;
};

export type MediaAssetLike = {
  src: ImageMetadataLike;
  alt: string;
  caption?: string;
  credit?: string;
};

export type ImageInput = MediaAssetLike | ImageMetadataLike | string;

export type NormalizedImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
  caption?: string;
  credit?: string;
};

type ContentSchemaInput = {
  path: string;
  title: string;
  description: string;
  publishedAt: string;
  modifiedAt?: string;
  image?: ImageInput;
  tags?: string[];
  externalUrls?: string[];
};

type MediaSchemaInput = ContentSchemaInput & {
  sourceUrl: string;
  thumbnail?: ImageInput;
  duration?: string;
  embedUrl?: string;
  videoMetadataVerified?: boolean;
};

type WebPageSchemaInput = {
  path: string;
  title: string;
  description: string;
  modifiedAt?: string;
};

export const SITE_URL = profile.siteUrl;
export const PERSON_ID = `${SITE_URL}/#vivek`;
export const PERSON_IMAGE_ID = `${SITE_URL}/#vivek-portrait`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FEATURED_PROJECT_IDS = ['krishi-ai', 'agentic-test-case-generator', 'deep-research-agent'] as const;
export const DEFAULT_SOCIAL_IMAGE: SocialImage = {
  src: '/images/og/default.png',
  alt: 'Vivek Maswadkar — AI/ML Engineer and Product Builder',
  width: 1200,
  height: 630,
  type: 'image/png',
};

export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function imageMimeType(formatOrPath: string): string {
  const value = formatOrPath.split(/[?#]/)[0]?.toLowerCase() ?? '';
  const format = value.includes('.') ? value.split('.').at(-1) ?? value : value;
  if (format === 'jpg' || format === 'jpeg') return 'image/jpeg';
  if (format === 'svg') return 'image/svg+xml';
  if (format === 'avif') return 'image/avif';
  if (format === 'gif') return 'image/gif';
  if (format === 'png') return 'image/png';
  if (format === 'webp') return 'image/webp';
  return `image/${format || 'unknown'}`;
}

export function normalizeImage(input?: ImageInput): NormalizedImage | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') {
    return { src: input, type: imageMimeType(input) };
  }

  if ('format' in input) {
    return {
      src: input.src,
      width: input.width,
      height: input.height,
      type: imageMimeType(input.format),
    };
  }

  return {
    src: input.src.src,
    alt: input.alt,
    width: input.src.width,
    height: input.src.height,
    type: imageMimeType(input.src.format),
    caption: input.caption,
    credit: input.credit,
  };
}

export function socialImageFromAsset(input: ImageInput): SocialImage | undefined {
  const image = normalizeImage(input);
  if (!image?.width || !image.height || !image.type) return undefined;
  return {
    src: image.src,
    alt: image.alt ?? '',
    width: image.width,
    height: image.height,
    type: image.type,
  };
}

function imageObjectNode(
  input: ImageInput | undefined,
  id: string,
  representativeOfPage = true,
): JsonLdNode | undefined {
  const image = normalizeImage(input);
  if (!image) return undefined;
  return {
    '@type': 'ImageObject',
    '@id': id,
    url: absoluteUrl(image.src),
    contentUrl: absoluteUrl(image.src),
    width: image.width,
    height: image.height,
    encodingFormat: image.type,
    caption: image.caption ?? image.alt,
    creditText: image.credit,
    representativeOfPage: representativeOfPage || undefined,
  };
}

function personImageNode(): JsonLdNode {
  return imageObjectNode({
    src: portraitImage,
    alt: 'Portrait of Vivek Maswadkar',
    caption: 'Vivek Maswadkar',
    credit: 'Vivek Maswadkar',
  }, PERSON_IMAGE_ID, false) as JsonLdNode;
}

export function utcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function latestDate(values: Array<string | undefined>): string {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? profile.updatedAt;
}

export function personNode(): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    url: `${SITE_URL}/`,
    jobTitle: profile.title,
    description: profile.description,
    image: personImageNode(),
    sameAs: profile.social.map((item) => item.href),
    homeLocation: { '@type': 'Place', name: profile.location },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: profile.education[0].institution,
    },
    knowsAbout: profile.skills.flatMap((group) => group.items),
  };
}

export function websiteNode(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: `${profile.name} — Portfolio`,
    description: profile.description,
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
  };
}

export function schemaGraph(nodes: JsonLdNode[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}

export function breadcrumbNode(items: BreadcrumbItem[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(items.at(-1)?.path ?? '/')}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageSchema(input: WebPageSchemaInput): JsonLdNode {
  const pageUrl = absoluteUrl(input.path);
  return schemaGraph([
    websiteNode(),
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: input.title,
      description: input.description,
      dateModified: input.modifiedAt ?? profile.updatedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': PERSON_ID },
    },
    personNode(),
  ]);
}

export function homeSchema(modifiedAt = profile.updatedAt): JsonLdNode {
  const pageUrl = absoluteUrl('/');
  return schemaGraph([
    websiteNode(),
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: `${profile.name} — AI/ML Engineer & Product Builder in Zürich`,
      description: profile.description,
      dateModified: modifiedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': PERSON_ID },
      mainEntity: { '@id': PERSON_ID },
    },
    personNode(),
  ]);
}

export function aboutSchema(): JsonLdNode {
  const pageUrl = absoluteUrl('/about/');
  return schemaGraph([
    websiteNode(),
    {
      '@type': 'ProfilePage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: `About — ${profile.name}`,
      description: `The roots, values, and journey behind ${profile.name}’s work in AI and technology.`,
      dateModified: profile.updatedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      mainEntity: { '@id': PERSON_ID },
      primaryImageOfPage: { '@id': PERSON_IMAGE_ID },
    },
    personNode(),
  ]);
}

export function resumeSchema(): JsonLdNode {
  const pageUrl = absoluteUrl('/resume/');
  return schemaGraph([
    websiteNode(),
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: `Résumé — ${profile.name}`,
      description: `The professional experience, skills, education, and credentials of ${profile.name}.`,
      dateModified: profile.updatedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': PERSON_ID },
    },
    personNode(),
  ]);
}

export function blogPostingSchema(input: ContentSchemaInput): JsonLdNode {
  const pageUrl = absoluteUrl(input.path);
  const primaryImageId = `${pageUrl}#primaryimage`;
  const primaryImage = imageObjectNode(input.image, primaryImageId);
  return schemaGraph([
    websiteNode(),
    personNode(),
    {
      '@type': 'BlogPosting',
      '@id': `${pageUrl}#article`,
      url: pageUrl,
      headline: input.title,
      description: input.description,
      datePublished: input.publishedAt,
      dateModified: input.modifiedAt ?? input.publishedAt,
      inLanguage: 'en',
      author: { '@id': PERSON_ID },
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      isPartOf: { '@id': WEBSITE_ID },
      image: primaryImage ? { '@id': primaryImageId } : undefined,
      keywords: input.tags?.join(', '),
      sameAs: input.externalUrls?.filter(Boolean),
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: input.title,
      description: input.description,
      datePublished: input.publishedAt,
      dateModified: input.modifiedAt ?? input.publishedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': `${pageUrl}#article` },
      primaryImageOfPage: primaryImage ? { '@id': primaryImageId } : undefined,
    },
    ...(primaryImage ? [primaryImage] : []),
    breadcrumbNode([
      { name: 'Home', path: '/' },
      { name: 'Writing', path: '/writing/' },
      { name: input.title, path: input.path },
    ]),
  ]);
}

export function creativeWorkSchema(input: ContentSchemaInput): JsonLdNode {
  const pageUrl = absoluteUrl(input.path);
  const primaryImageId = `${pageUrl}#primaryimage`;
  const primaryImage = imageObjectNode(input.image, primaryImageId);
  return schemaGraph([
    websiteNode(),
    personNode(),
    {
      '@type': 'CreativeWork',
      '@id': `${pageUrl}#work`,
      url: pageUrl,
      name: input.title,
      headline: input.title,
      description: input.description,
      datePublished: input.publishedAt,
      dateModified: input.modifiedAt ?? input.publishedAt,
      inLanguage: 'en',
      creator: { '@id': PERSON_ID },
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      isPartOf: { '@id': WEBSITE_ID },
      image: primaryImage ? { '@id': primaryImageId } : undefined,
      keywords: input.tags?.join(', '),
      sameAs: input.externalUrls?.filter(Boolean),
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: input.title,
      description: input.description,
      datePublished: input.publishedAt,
      dateModified: input.modifiedAt ?? input.publishedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': `${pageUrl}#work` },
      primaryImageOfPage: primaryImage ? { '@id': primaryImageId } : undefined,
    },
    ...(primaryImage ? [primaryImage] : []),
    breadcrumbNode([
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work/' },
      { name: input.title, path: input.path },
    ]),
  ]);
}

export function mediaSchema(input: MediaSchemaInput): JsonLdNode {
  const pageUrl = absoluteUrl(input.path);
  const thumbnail = normalizeImage(input.thumbnail);
  const primaryImageId = `${pageUrl}#primaryimage`;
  const primaryImage = imageObjectNode(input.thumbnail, primaryImageId);
  const hasVerifiedVideoMetadata = input.videoMetadataVerified === true
    && Boolean(thumbnail && input.duration && input.embedUrl);
  const mediaNode: JsonLdNode = hasVerifiedVideoMetadata
    ? {
        '@type': 'VideoObject',
        '@id': `${pageUrl}#media`,
        name: input.title,
        description: input.description,
        thumbnailUrl: [absoluteUrl(thumbnail?.src ?? '')],
        uploadDate: input.publishedAt,
        dateModified: input.modifiedAt ?? input.publishedAt,
        duration: input.duration,
        embedUrl: input.embedUrl,
        url: pageUrl,
        sameAs: input.sourceUrl,
        creator: { '@id': PERSON_ID },
        mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
        isPartOf: { '@id': WEBSITE_ID },
        inLanguage: 'en',
        image: primaryImage ? { '@id': primaryImageId } : undefined,
      }
    : {
        '@type': 'CreativeWork',
        '@id': `${pageUrl}#media`,
        name: input.title,
        description: input.description,
        datePublished: input.publishedAt,
        dateModified: input.modifiedAt ?? input.publishedAt,
        url: pageUrl,
        sameAs: input.sourceUrl,
        creator: { '@id': PERSON_ID },
        mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
        isPartOf: { '@id': WEBSITE_ID },
        inLanguage: 'en',
        keywords: input.tags?.join(', '),
        image: primaryImage ? { '@id': primaryImageId } : undefined,
      };

  return schemaGraph([
    websiteNode(),
    personNode(),
    mediaNode,
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: input.title,
      description: input.description,
      datePublished: input.publishedAt,
      dateModified: input.modifiedAt ?? input.publishedAt,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': `${pageUrl}#media` },
      primaryImageOfPage: primaryImage ? { '@id': primaryImageId } : undefined,
    },
    ...(primaryImage ? [primaryImage] : []),
    breadcrumbNode([
      { name: 'Home', path: '/' },
      { name: 'Media', path: '/media/' },
      { name: input.title, path: input.path },
    ]),
  ]);
}
