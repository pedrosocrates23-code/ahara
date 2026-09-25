#!/usr/bin/env node
/**
 * Fila de publicação do blog da Ahara.
 *
 * Um post entra na fila quando o .mdx está no repositório com pub_date no futuro. Ele só vira
 * página no primeiro build depois da data (src/lib/publicacao.ts). Os builds dos dias de
 * publicação são disparados por dois gatilhos independentes, os dois idempotentes:
 *   1. GitHub Actions  .github/workflows/fila-publicacao.yml   seg/qua/sex 10:00 UTC (07:00 BRT)
 *   2. Vercel Cron     api/publicar-fila.js (vercel.json)      seg/qua/sex 11:30 UTC, janela de 1 h
 * Cada um só chama o Deploy Hook se o post do dia ainda devolve 404. Quando a fila esvazia,
 * os dois continuam agendados mas não disparam nada.
 *
 * Regras da fila (verificadas por --verificar):
 *   - todo post com pub_date no futuro cai em segunda, quarta ou sexta, às 09:00 UTC (06:00 BRT);
 *   - no máximo um post por dia;
 *   - api/_fila.js corresponde exatamente aos posts agendados (gere com --gerar-api).
 *
 * Uso:
 *   node scripts/fila-publicacao.mjs --status       tabela da fila
 *   node scripts/fila-publicacao.mjs --hoje         slugs que vencem hoje (BRT), um por linha
 *   node scripts/fila-publicacao.mjs --gerar-api    reescreve api/_fila.js
 *   node scripts/fila-publicacao.mjs --verificar    exit 1 se alguma regra falhar
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src', 'content', 'blog');
const API_FILA = join(ROOT, 'api', '_fila.js');
const DIAS_PERMITIDOS = new Set([1, 3, 5]); // segunda, quarta, sexta (getUTCDay)
const HORA_UTC = 9; // 06:00 em Brasília (UTC-3, sem horário de verão desde 2019)
const NOMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const campo = (fm, nome) => {
  const m = fm.match(new RegExp(`^${nome}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
};

export function lerPosts() {
  return readdirSync(BLOG)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const txt = readFileSync(join(BLOG, f), 'utf-8');
      const fm = (txt.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];
      return {
        slug: f.replace(/\.mdx$/, ''),
        h1: campo(fm, 'h1') || '',
        pub_date: new Date(campo(fm, 'pub_date')),
        draft: campo(fm, 'draft') === 'true',
      };
    });
}

const diaBRT = (d) => new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);

export function agendados(posts, agora = Date.now()) {
  return posts
    .filter((p) => !p.draft && p.pub_date.getTime() > agora)
    .sort((a, b) => a.pub_date - b.pub_date);
}

function status(posts) {
  const fila = agendados(posts);
  const publicados = posts.filter((p) => !p.draft && p.pub_date.getTime() <= Date.now()).length;
  console.log(`Publicados: ${publicados} | Na fila: ${fila.length} | Rascunhos: ${posts.filter((p) => p.draft).length}`);
  for (const p of fila) {
    console.log(`${diaBRT(p.pub_date)} ${NOMES[p.pub_date.getUTCDay()]}  ${p.slug}`);
  }
  if (fila.length) console.log(`Último post da fila: ${diaBRT(fila[fila.length - 1].pub_date)}`);
}

function hoje(posts) {
  const d = diaBRT(new Date());
  posts
    .filter((p) => !p.draft && diaBRT(p.pub_date) === d && p.pub_date.getTime() <= Date.now())
    .forEach((p) => console.log(p.slug));
}

function conteudoApi(posts) {
  const fila = agendados(posts).map((p) => ({ slug: p.slug, pub_date: p.pub_date.toISOString() }));
  return (
    '// GERADO por scripts/fila-publicacao.mjs --gerar-api. Não editar à mão.\n' +
    '// Posts agendados no momento do commit, lidos pela função api/publicar-fila.js.\n' +
    `export const fila = ${JSON.stringify(fila, null, 2)};\n`
  );
}

function verificar(posts) {
  const erros = [];
  const fila = agendados(posts);
  const porDia = new Map();
  for (const p of fila) {
    if (Number.isNaN(p.pub_date.getTime())) erros.push(`${p.slug}: pub_date inválido`);
    if (!DIAS_PERMITIDOS.has(p.pub_date.getUTCDay()))
      erros.push(`${p.slug}: ${diaBRT(p.pub_date)} cai em ${NOMES[p.pub_date.getUTCDay()]}, fora de seg/qua/sex`);
    if (p.pub_date.getUTCHours() !== HORA_UTC || p.pub_date.getUTCMinutes() !== 0)
      erros.push(`${p.slug}: horário ${p.pub_date.toISOString()} fora do padrão ${HORA_UTC}:00 UTC`);
    const d = diaBRT(p.pub_date);
    if (porDia.has(d)) erros.push(`${p.slug}: dia ${d} já ocupado por ${porDia.get(d)}`);
    porDia.set(d, p.slug);
  }
  if (!existsSync(API_FILA)) erros.push('api/_fila.js ausente (rode --gerar-api)');
  else {
    const atual = readFileSync(API_FILA, 'utf-8');
    const lista = [...atual.matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]);
    const faltando = fila.filter((p) => !lista.includes(p.slug)).map((p) => p.slug);
    if (faltando.length) erros.push(`api/_fila.js desatualizado, faltam: ${faltando.join(', ')} (rode --gerar-api)`);
  }
  if (erros.length) {
    console.error('FILA INVÁLIDA:\n- ' + erros.join('\n- '));
    process.exit(1);
  }
  console.log(`Fila OK: ${fila.length} post(s) agendado(s), todos em seg/qua/sex, um por dia.`);
}

const posts = lerPosts();
const arg = process.argv[2];
if (arg === '--status') status(posts);
else if (arg === '--hoje') hoje(posts);
else if (arg === '--gerar-api') {
  writeFileSync(API_FILA, conteudoApi(posts), 'utf-8');
  console.log(`api/_fila.js gerado com ${agendados(posts).length} post(s).`);
} else if (arg === '--verificar') verificar(posts);
else {
  console.error('Uso: --status | --hoje | --gerar-api | --verificar');
  process.exit(2);
}
