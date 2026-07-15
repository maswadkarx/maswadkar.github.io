import type { ImageMetadata } from 'astro';

export type MediaKind =
  | 'screenshot'
  | 'diagram'
  | 'photograph'
  | 'editorial-illustration'
  | 'synthetic-demo';

export type MediaProvenance =
  | 'user-owned'
  | 'project-evidence'
  | 'generated-editorial'
  | 'synthetic-demo';

export type MediaAsset = {
  src: ImageMetadata;
  alt: string;
  kind: MediaKind;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  provenance: MediaProvenance;
};

export type SocialMediaAsset = {
  src: ImageMetadata;
  alt: string;
};

export function imageMimeType(image: ImageMetadata): string {
  const format = image.format.toLocaleLowerCase('en');
  if (format === 'jpg' || format === 'jpeg') return 'image/jpeg';
  if (format === 'svg') return 'image/svg+xml';
  return `image/${format}`;
}

export function socialImageProps(image: SocialMediaAsset) {
  return {
    src: image.src.src,
    alt: image.alt,
    width: image.src.width,
    height: image.src.height,
    type: imageMimeType(image.src),
  };
}

export function focalPosition(focalPoint: MediaAsset['focalPoint'] = 'center'): string {
  return {
    center: 'center center',
    top: 'center top',
    bottom: 'center bottom',
    left: 'left center',
    right: 'right center',
  }[focalPoint];
}
