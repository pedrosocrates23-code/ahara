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

// Integração: links para post ainda não publicado viram texto no HTML final.
//
// Um post agendado (pub_date no futuro) já existe em src/content/blog, então outro post
// pode linkar para ele antes da data. Como a rota só é gerada quando a data chega, o link
// seria 404 até lá. Depois do build, este passo procura todo <a> que aponta para
// /blog/<slug>/ sem página correspondente em dist e troca o link pelo texto da âncora.
// No build do dia da publicação a página existe e o link volta sozinho.
// Roda antes do astro-compress, sobre o HTML ainda não minificado.
function linksAgendados() {
  return {
    name: 'ahara-links-agendados',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const { readdirSync, readFileSync, writeFileSync, existsSync, statSync } = await import('node:fs');
        const { join } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const raiz = fileURLToPath(dir);
        const htmls = [];
        const andar = (d) => {
          for (const nome of readdirSync(d)) {
            const p = join(d, nome);
            if (statSync(p).isDirectory()) andar(p);
            else if (nome.endsWith('.html')) htmls.push(p);
          }
        };
        andar(raiz);
        const re = /<a\b[^>]*\bhref="(?:https?:\/\/(?:www\.)?aharabr\.com\.br)?\/blog\/([a-z0-9-]+)\/?(?:[#?][^"]*)?"[^>]*>([\s\S]*?)<\/a>/g;
        let total = 0;
        const alvos = new Set();
        for (const arq of htmls) {
          const html = readFileSync(arq, 'utf-8');
          let trocas = 0;
          const novo = html.replace(re, (tudo, slug, texto) => {
            if (existsSync(join(raiz, 'blog', slug, 'index.html'))) return tudo;
            trocas++;
            alvos.add(slug);
            return texto;
          });
          if (trocas) {
            writeFileSync(arq, novo, 'utf-8');
            total += trocas;
          }
        }
        logger.info(`${total} link(s) para post ainda não publicado viraram texto (${alvos.size} destino(s))`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://aharabr.com.br',
  compressHTML: true,
  image: {
    quality: 80,
  },
  build: {
    inlineStylesheets: 'always',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx({ rehypePlugins: [rehypeResponsiveTables] }),
    linksAgendados(),
    compress({
      CSS: true,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
});
