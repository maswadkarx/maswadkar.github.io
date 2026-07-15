import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://resume.maswadkar.com',
  integrations: [mdx(), icon()],
  devToolbar: {
    enabled: false,
  },
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
