// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://blog.neomindflow.cloud',
  base: '/',
  integrations: [
    sitemap({ filter: (page) => !page.includes('/tags/') }),
    mdx(),
  ],
  trailingSlash: 'ignore',
});
