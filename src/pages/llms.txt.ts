import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished } from '@/lib/publicacao';
import { SILOS, siloOf } from '@/lib/schema';
import { site } from '@/data/site';

/**
 * /llms.txt (spec llmstxt.org): resumo do site para agentes de IA.
 * Gerado no build, como o sitemap: preço e condições vêm de src/data/site.ts e os
 * guias do blog entram pelo silo de src/lib/schema.ts, então post publicado pela
 * fila e mudança de preço aparecem aqui sem edição manual.
 */
const SITE = site.url;

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => isPublished(data));
  const porSlug = new Map(posts.map((p) => [p.id, p]));

  const { pricing } = site;
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const faixas = pricing.discountTiers.map((t) => `${t.discountPercent}% a partir de ${t.kg} kg`).join(', ');
  const gramaturas = pricing.packagings.map((p) => p.label).join(', ');

  // Um item por silo: o pillar (se já publicado) com a contagem de guias do silo.
  const silos = SILOS.filter((s) => s.key !== 'geral')
    .map((s) => ({ s, pillar: porSlug.get(s.pillarSlug), total: posts.filter((p) => siloOf(p.id).key === s.key).length }))
    .filter(({ pillar, total }) => pillar && total > 0);

  const linhas = [
    `# ${site.name}`,
    '',
    `> ${site.name} é uma fábrica de batata chips artesanal, sabor tradicional, em ${site.location}, que vende por quilo para atacado, revenda, comércios e eventos. Preço base de ${brl(pricing.baseKg)}/kg, pedido mínimo de ${pricing.minOrder} kg e embalagens de ${gramaturas}.`,
    '',
    `Razão social ${site.legalName}, CNPJ ${site.cnpj}, ${site.address.full}. Atende o Distrito Federal com entrega direta e envia para todo o Brasil por transportadora, com frete calculado por pedido. Desconto progressivo sobre o preço base: ${faixas}. O pedido é fechado pelo WhatsApp, a partir da página de contato.`,
    '',
    '## Páginas principais',
    '',
    `- [Produtos](${SITE}/produtos/): batata chips tradicional em ${gramaturas}, ingredientes, alergênicos, tabela de preço por kg e logística`,
    `- [Para revendedores](${SITE}/para-revendedores/): condições para quem compra para revender`,
    `- [Para comércios](${SITE}/para-comercios/): batata chips para mercados e comércios`,
    `- [Para eventos](${SITE}/para-eventos/): eventos, festas e food service`,
    `- [Contato](${SITE}/contato/): orçamento e pedido pelo WhatsApp`,
    `- [Sobre a Ahara](${SITE}/sobre/): a fábrica e a produção em Brasília`,
    '',
    ...(silos.length
      ? [
          '## Guias por tema',
          '',
          ...silos.map(
            ({ s, pillar, total }) =>
              `- [${s.name}: ${pillar!.data.h1}](${SITE}/blog/${pillar!.id}/): ${pillar!.data.meta_description} (${total} ${total === 1 ? 'guia' : 'guias'} no tema)`,
          ),
          '',
        ]
      : []),
    '## Optional',
    '',
    `- [Blog](${SITE}/blog/): todos os ${posts.length} artigos publicados`,
    `- [${site.founder}, fundador](${SITE}/autor/joao-amaro/): autor dos artigos`,
    `- [Política de qualidade](${SITE}/politica-de-qualidade/)`,
    `- [Política de privacidade](${SITE}/politica-de-privacidade/)`,
    `- [Sitemap](${SITE}/sitemap.xml): todas as URLs indexáveis`,
    '',
  ];

  return new Response(linhas.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
