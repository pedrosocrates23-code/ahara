import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://aharabr.com.br',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    compress({
      CSS: false,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
});
