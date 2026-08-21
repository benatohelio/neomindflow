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
  redirects: {
    '/blog/best-personal-development-books/': '/blog/best-self-improvement-books/',
    '/blog/best-personal-growth-books/': '/blog/best-self-improvement-books/',
  },
  trailingSlash: 'ignore',
});
