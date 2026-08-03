import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@netlify/vite-plugin';

export default defineConfig({
  site: 'https://kohtzerui.com',
  integrations: [mdx()],
  vite: {
    plugins: [netlify()],
  },
  output: 'static',
});