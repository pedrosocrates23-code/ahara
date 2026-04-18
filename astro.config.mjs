import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import compress from 'astro-compress';

// Rehype plugin: envolve <table> em dois divs para scroll horizontal responsivo
function rehypeResponsiveTables() {
  return (tree) => {
    function visit(node) {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'element' && child.tagName === 'table') {
          node.children[i] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-outer'] },
            children: [{
              type: 'element',
              tagName: 'div',
              properties: { className: ['table-scroll'] },
              children: [child],
            }],
          };
        } else {
          visit(child);
        }
      }
    }
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://aharabr.com.br',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx({ rehypePlugins: [rehypeResponsiveTables] }),
    compress({
      CSS: true,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
});
