import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://imjae.github.io',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
    }),
  },
  redirects: {
    '/profile': '/about/',
    '/blog': '/writing/',
    '/archive': '/writing/',
    '/book': '/topics/reading/',
  },
});
