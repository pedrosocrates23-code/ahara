import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Astro 5 Content Layer API: carrega .mdx de src/content/blog/
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    h1: z.string(),
    keyword: z.string(),
    meta_description: z.string(),
    sumario_html: z.string().optional().default(''),
    palavras_totais: z.number().int().positive(),
    ctas_internos: z.number().int().nonnegative().default(0),
    pub_date: z.string().transform((s) => new Date(s)),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
