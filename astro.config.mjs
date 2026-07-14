import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://resume.maswadkar.com',
  integrations: [mdx(), sitemap(), icon()],
  devToolbar: {
    enabled: false,
  },
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
