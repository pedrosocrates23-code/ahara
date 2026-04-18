import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://aharabr.com.br';

interface Route {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
  images?: { loc: string; title: string }[];
}

const staticRoutes: Route[] = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'weekly',
    images: [{ loc: `${SITE}/images/hero-chips.webp`, title: 'Batatas chips artesanais Ahara – sabor tradicional' }],
  },
  {
    path: '/produtos/',
    priority: 0.9,
    changefreq: 'monthly',
    images: [
      { loc: `${SITE}/images/hero-chips.webp`,  title: 'Batatas chips artesanais Ahara – sabor tradicional' },
      { loc: `${SITE}/images/chips-bowl-2.webp`, title: 'Batatas chips Ahara – matéria-prima selecionada' },
    ],
  },
  { path: '/para-revendedores/',  priority: 0.85, changefreq: 'monthly' },
  { path: '/para-comercios/',     priority: 0.85, changefreq: 'monthly' },
  { path: '/para-eventos/',       priority: 0.85, changefreq: 'monthly' },
  { path: '/contato/',                    priority: 0.8,  changefreq: 'monthly' },
  { path: '/sobre/',                      priority: 0.7,  changefreq: 'monthly' },
  { path: '/blog/',                       priority: 0.75, changefreq: 'weekly'  },
  { path: '/autor/joao-amaro/',           priority: 0.6,  changefreq: 'monthly' },
  { path: '/politica-de-privacidade/',    priority: 0.3,  changefreq: 'yearly'  },
  { path: '/politica-de-qualidade/',      priority: 0.5,  changefreq: 'yearly'  },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const blogRoutes: Route[] = posts.map((p) => ({
    path: `/blog/${p.id}/`,
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: p.data.pub_date.toISOString(),
    images: [{ loc: `${SITE}/images/hero-chips.webp`, title: p.data.h1 }],
  }));

  const now = new Date().toISOString();
  const routes = [...staticRoutes, ...blogRoutes];

  const urls = routes
    .map((r) => {
      const imageTags = (r.images || [])
        .map((img) => `    <image:image>\n      <image:loc>${img.loc}</image:loc>\n      <image:title>${img.title}</image:title>\n    </image:image>`)
        .join('\n');
      return `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${r.lastmod || now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>${imageTags ? '\n' + imageTags : ''}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
