import type { APIRoute } from 'astro';

// Sitemap custom em /sitemap.xml (sem shards, sem index).
// Mantenha as rotas em sincronia com src/pages/*.astro.

const SITE = 'https://aharabr.com.br';

interface Route {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

const routes: Route[] = [
  { path: '/',                    priority: 1.0,  changefreq: 'weekly'  },
  { path: '/produtos/',           priority: 0.9,  changefreq: 'monthly' },
  { path: '/para-revendedores/',  priority: 0.85, changefreq: 'monthly' },
  { path: '/para-comercios/',     priority: 0.85, changefreq: 'monthly' },
  { path: '/para-eventos/',       priority: 0.85, changefreq: 'monthly' },
  { path: '/contato/',            priority: 0.8,  changefreq: 'monthly' },
  { path: '/sobre/',              priority: 0.7,  changefreq: 'monthly' },
  { path: '/blog/',               priority: 0.6,  changefreq: 'weekly'  },
];

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString();

  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
