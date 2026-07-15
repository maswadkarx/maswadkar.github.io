import { profile } from '../data/profile';

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

type ContentSchemaInput = {
  path: string;
  title: string;
  description: string;
  publishedAt: string;
  modifiedAt?: string;
  image?: string;
  tags?: string[];
  externalUrls?: string[];
};

type MediaSchemaInput = ContentSchemaInput & {
  sourceUrl: string;
  thumbnailUrl?: string;
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
      image: input.image ? absoluteUrl(input.image) : undefined,
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
    },
    breadcrumbNode([
      { name: 'Home', path: '/' },
      { name: 'Writing', path: '/writing/' },
      { name: input.title, path: input.path },
    ]),
  ]);
}

export function creativeWorkSchema(input: ContentSchemaInput): JsonLdNode {
  const pageUrl = absoluteUrl(input.path);
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
      image: input.image ? absoluteUrl(input.image) : undefined,
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
    },
    breadcrumbNode([
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work/' },
      { name: input.title, path: input.path },
    ]),
  ]);
}

export function mediaSchema(input: MediaSchemaInput): JsonLdNode {
  const pageUrl = absoluteUrl(input.path);
  const hasVerifiedVideoMetadata = input.videoMetadataVerified === true
    && Boolean(input.thumbnailUrl && input.duration && input.embedUrl);
  const mediaNode: JsonLdNode = hasVerifiedVideoMetadata
    ? {
        '@type': 'VideoObject',
        '@id': `${pageUrl}#media`,
        name: input.title,
        description: input.description,
        thumbnailUrl: [input.thumbnailUrl],
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
    },
    breadcrumbNode([
      { name: 'Home', path: '/' },
      { name: 'Media', path: '/media/' },
      { name: input.title, path: input.path },
    ]),
  ]);
}
