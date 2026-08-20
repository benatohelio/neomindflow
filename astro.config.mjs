// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ATENÇÃO: quando apontar o domínio próprio (blog.neomindflow.cloud), mudar para:
//   site: 'https://blog.neomindflow.cloud',
//   base: '/',
export default defineConfig({
  site: 'https://benatohelio.github.io',
  base: '/neomindflow/',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
});
