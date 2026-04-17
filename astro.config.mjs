import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://aharabr.com.br',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname;

        if (path === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/produtos')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/para-')) {
          item.priority = 0.85;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/contato')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/sobre')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/blog')) {
          item.priority = 0.6;
          item.changefreq = 'weekly';
        }

        return item;
      },
    }),
    compress({
      CSS: false,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
});
