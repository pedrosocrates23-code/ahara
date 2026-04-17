import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://aharabr.com.br';

interface Route {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
}

const staticRoutes: Route[] = [
  { path: '/',                    priority: 1.0,  changefreq: 'weekly'  },
  { path: '/produtos/',           priority: 0.9,  changefreq: 'monthly' },
  { path: '/para-revendedores/',  priority: 0.85, changefreq: 'monthly' },
  { path: '/para-comercios/',     priority: 0.85, changefreq: 'monthly' },
  { path: '/para-eventos/',       priority: 0.85, changefreq: 'monthly' },
  { path: '/contato/',            priority: 0.8,  changefreq: 'monthly' },
  { path: '/sobre/',              priority: 0.7,  changefreq: 'monthly' },
  { path: '/blog/',               priority: 0.75, changefreq: 'weekly'  },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const blogRoutes: Route[] = posts.map((p) => ({
    path: `/blog/${p.id}/`,
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: p.data.pub_date.toISOString(),
  }));

  const now = new Date().toISOString();
  const routes = [...staticRoutes, ...blogRoutes];

  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${r.lastmod || now}</lastmod>
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
