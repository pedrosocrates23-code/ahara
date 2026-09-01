import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Astro 5 Content Layer API: carrega .mdx de src/content/blog/
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    h1: z.string(),
    seo_title: z.string().optional(), // <title> curto (<=55 chars); fallback: h1
    keyword: z.string(),
    meta_description: z.string(),
    sumario_html: z.string().optional().default(''),
    palavras_totais: z.number().int().positive(),
    ctas_internos: z.number().int().nonnegative().default(0),
    pub_date: z.string().transform((s) => new Date(s)),
    // Data da última alteração real do conteúdo. Fica separada de pub_date porque
    // um post editado não é um post republicado: o Google usa dateModified como
    // sinal de frescor e lastmod para priorizar o rastreamento. Opcional: quando
    // ausente, ambos caem em pub_date, que é o comportamento anterior.
    updated_date: z.string().transform((s) => new Date(s)).optional(),
    draft: z.boolean().optional().default(false),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional()
      .default([]),
  }),
});

export const collections = { blog };
