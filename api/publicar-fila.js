// Gatilho da fila de publicação chamado pelo Vercel Cron (vercel.json), seg/qua/sex.
//
// É o segundo gatilho: o primeiro é o GitHub Actions (.github/workflows/fila-publicacao.yml),
// uma hora e meia antes. Esta função só dispara o Deploy Hook se algum post que vence hoje
// ainda devolve 404, então ela não duplica build quando o GitHub já publicou.
//
// Variáveis de ambiente na Vercel (Settings > Environment Variables, ambiente Production):
//   CRON_SECRET          a Vercel envia "Authorization: Bearer <CRON_SECRET>" nas chamadas do Cron
//   VERCEL_DEPLOY_HOOK   URL do Deploy Hook da branch main (Settings > Git > Deploy Hooks)
import { fila } from './_fila.js';

const SITE = 'https://aharabr.com.br';
const diaBRT = (d) => new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const agora = new Date();
  const hoje = diaBRT(agora);
  const vencidos = fila.filter((p) => diaBRT(new Date(p.pub_date)) === hoje && new Date(p.pub_date) <= agora);
  if (vencidos.length === 0) {
    return Response.json({ acao: 'nada-hoje', hoje });
  }

  const pendentes = [];
  for (const p of vencidos) {
    const r = await fetch(`${SITE}/blog/${p.slug}/`, { method: 'HEAD', redirect: 'manual' });
    if (r.status !== 200) pendentes.push({ slug: p.slug, status: r.status });
  }
  if (pendentes.length === 0) {
    return Response.json({ acao: 'ja-publicado', hoje, slugs: vencidos.map((p) => p.slug) });
  }

  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) {
    console.error('VERCEL_DEPLOY_HOOK ausente: post vencido sem build', pendentes);
    return Response.json({ acao: 'erro', motivo: 'VERCEL_DEPLOY_HOOK ausente', pendentes }, { status: 500 });
  }
  const resp = await fetch(hook, { method: 'POST' });
  const corpo = await resp.text();
  console.log('Deploy Hook disparado', resp.status, pendentes);
  return Response.json({ acao: 'build-disparado', hoje, pendentes, hook_status: resp.status, hook_resposta: corpo.slice(0, 300) });
}
