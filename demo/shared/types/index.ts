export type SocialMediaKey = 'email' | 'telegram' | 'x' | 'linkedin' | 'github';

export type SocialMediaItem = {
  type: SocialMediaKey;
  href: string;
};

export type SocialMedia = Record<SocialMediaKey, string>;

export type LibraryKey = 'js' | 'ts' | 'vue' | 'nuxt' | 'react' | 'svelte' | 'angular';

export type LibraryItem = {
  key: LibraryKey;
  href: string;
  examplesHref: string;
  customizationHref: string;
  logo: string;
  label: string;
  delivered?: boolean;
};

export type HeroMarqueeItem = {
  key: LibraryKey;
  href: string;
  logo: string;
  label: string;
  delivered?: boolean;
};
