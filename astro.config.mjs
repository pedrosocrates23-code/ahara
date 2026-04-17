import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://aharabr.com.br',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    compress({
      CSS: false,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
});
