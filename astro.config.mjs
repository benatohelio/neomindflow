// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.neomindflow.cloud',
  base: '/',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
});
