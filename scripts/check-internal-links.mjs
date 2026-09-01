#!/usr/bin/env node
/**
 * Guardrail da malha de links internos.
 *
 * Varre src/content/blog/*.mdx e reprova quando encontra:
 *   1. href interno apontando para rota que nao existe (404 interno)
 *   2. rel="nofollow" em link interno
 *   3. ancora generica ("clique aqui", "saiba mais", ...)
 *   4. URL absoluta para o proprio dominio (a convencao do projeto e usar caminho relativo)
 *
 * Tambem relata, sem reprovar, os posts sem link editorial de entrada ou de saida.
 *
 * Uso:
 *   node scripts/check-internal-links.mjs           relatorio + exit 1 se houver erro
 *   node scripts/check-internal-links.mjs --report  so relatorio, sempre exit 0
 *
 * Motivo de existir: em 31/08/2026 uma auditoria encontrou 57 links internos apontando
 * para tres URLs que devolviam 404 em producao, e 39 links internos marcados nofollow.
 * Este script existe para que isso nao volte por descuido.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src', 'content', 'blog');
const SOMENTE_RELATORIO = process.argv.includes('--report');

const INSTITUCIONAIS = new Set([
  '/', '/produtos/', '/para-revendedores/', '/para-comercios/', '/para-eventos/',
  '/contato/', '/sobre/', '/blog/', '/autor/joao-amaro/',
  '/politica-de-privacidade/', '/politica-de-qualidade/',
]);

const ANCORAS_GENERICAS = new Set([
  'clique aqui', 'saiba mais', 'veja mais', 'leia mais', 'aqui', 'confira',
  'acesse', 'veja', 'clique', 'este link', 'link',
]);

// Âncora que é a própria URL ("/produtos/", "https://aharabr.com.br/para-comercios/")
// também não descreve o destino: para o leitor e para o buscador ela carrega tanta
// informação quanto "clique aqui". A lista acima não pegava esse formato.
const ancoraEhUrl = (t) => /^(https?:\/\/|\/)[^\s]*$/.test(t.trim());

const arquivos = readdirSync(BLOG).filter((f) => f.endsWith('.mdx'));
const slugs = arquivos.map((f) => f.replace(/\.mdx$/, ''));
const rotas = new Set([...INSTITUCIONAIS, ...slugs.map((s) => `/blog/${s}/`)]);

const normaliza = (u) => {
  let v = u.replace(/^https?:\/\/(www\.)?aharabr\.com\.br/, '');
  v = v.split('#')[0].split('?')[0];
  if (!v) return '/';
  if (!v.startsWith('/')) return null;
  const ultimo = v.split('/').pop();
  if (v.length > 1 && !v.endsWith('/') && !ultimo.includes('.')) v += '/';
  return v;
};

const erros = [];
const ancorasUrl = [];
const grafo = new Map();
const inDegree = new Map(slugs.map((s) => [`/blog/${s}/`, 0]));

const TAG_A = /<a\s[^>]*>[\s\S]*?<\/a>/gi;
const HREF = /href=["']([^"']+)["']/i;
const MD = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;

for (const arquivo of arquivos.sort()) {
  const slug = arquivo.replace(/\.mdx$/, '');
  const origem = `/blog/${slug}/`;
  const texto = readFileSync(join(BLOG, arquivo), 'utf8');
  const saidas = [];

  const registra = (destino, ancora, tagBruta) => {
    const alvo = normaliza(destino);
    if (alvo === null) return; // link externo
    if (!rotas.has(alvo)) {
      erros.push({ tipo: 'destino-inexistente', arquivo, detalhe: `${destino} -> ${alvo}` });
      return;
    }
    if (/^https?:\/\//i.test(destino)) {
      erros.push({ tipo: 'url-absoluta-interna', arquivo, detalhe: destino });
    }
    if (tagBruta && /rel=["'][^"']*nofollow/i.test(tagBruta)) {
      erros.push({ tipo: 'nofollow-interno', arquivo, detalhe: alvo });
    }
    const limpa = (ancora || '').replace(/<[^>]+>/g, '').trim().toLowerCase();
    if (ANCORAS_GENERICAS.has(limpa)) {
      erros.push({ tipo: 'ancora-generica', arquivo, detalhe: `"${limpa}" -> ${alvo}` });
    } else if (ancoraEhUrl(limpa)) {
      ancorasUrl.push({ arquivo, detalhe: `"${limpa}" -> ${alvo}` });
    }
    if (alvo.startsWith('/blog/') && alvo !== '/blog/' && alvo !== origem) {
      // Array, não Set: o Set mediria destinos distintos e esconderia o caso de um
      // post linkar duas vezes o mesmo alvo, que é exatamente o que se quer ver.
      saidas.push(alvo);
      inDegree.set(alvo, (inDegree.get(alvo) ?? 0) + 1);
    }
  };

  for (const tag of texto.match(TAG_A) ?? []) {
    const h = tag.match(HREF);
    if (h) registra(h[1], tag, tag);
  }
  for (const m of texto.matchAll(MD)) registra(m[2], m[1], null);

  grafo.set(origem, saidas);
}

// Invariante dos silos: todo pillar declarado precisa existir como post E classificar
// no próprio silo que o declarou. Como siloOf() é dependente de ordem, um pillar cujo
// slug case um silo anterior listaria os spokes do silo errado sob a própria identidade.
// schema.ts usa o alias '@/data', que só o resolvedor do Astro entende, então o
// arquivo é lido como texto e o array é reconstruído por parsing. A ordem das
// entradas é preservada porque siloOf() devolve o PRIMEIRO match.
try {
  const fonte = readFileSync(join(ROOT, 'src', 'lib', 'schema.ts'), 'utf8');
  const bloco = fonte.match(/export const SILOS[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!bloco) throw new Error('array SILOS nao encontrado em src/lib/schema.ts');
  const entradas = [...bloco[1].matchAll(
    /key:\s*'([^']+)'[\s\S]*?pillarSlug:\s*(?:'([^']+)'|null)[\s\S]*?match:\s*\/([\s\S]*?)\/[gimsuy]*,/g,
  )].map((m) => ({ key: m[1], pillarSlug: m[2] ?? null, re: new RegExp(m[3]) }));

  const siloDe = (slug) => entradas.find((s) => s.re.test(slug))?.key ?? 'geral';

  for (const silo of entradas) {
    if (!silo.pillarSlug) continue;
    if (!slugs.includes(silo.pillarSlug)) {
      erros.push({ tipo: 'pillar-inexistente', arquivo: 'src/lib/schema.ts', detalhe: `${silo.key} -> ${silo.pillarSlug}` });
      continue;
    }
    const resolvido = siloDe(silo.pillarSlug);
    if (resolvido !== silo.key) {
      erros.push({
        tipo: 'pillar-em-silo-errado',
        arquivo: 'src/lib/schema.ts',
        detalhe: `${silo.pillarSlug} declara ser pillar de "${silo.key}" mas resolve para "${resolvido}"`,
      });
    }
  }

  const porSilo = {};
  for (const s of slugs) {
    const k = siloDe(s);
    (porSilo[k] ??= []).push(s);
  }
  console.log('\nsilos (%d declarados): %s', entradas.length,
    Object.entries(porSilo).map(([k, v]) => `${k}=${v.length}`).join(', '));
  if (porSilo.geral?.length) {
    console.log('slugs sem silo proprio (caem em "geral"): %d\n  %s',
      porSilo.geral.length, porSilo.geral.join('\n  '));
  }
} catch (e) {
  console.log('\n(invariante de silos nao verificada: %s)', e.message);
}

const orfaos = [...inDegree].filter(([, n]) => n === 0).map(([u]) => u);
const semSaida = [...grafo].filter(([, s]) => s.length === 0).map(([u]) => u);
const totalArestas = [...grafo.values()].reduce((a, s) => a + s.length, 0);
const destinosDistintos = [...grafo.values()].reduce((a, s) => a + new Set(s).size, 0);

console.log('Malha de links internos — %d posts, %d rotas validas', slugs.length, rotas.size);
console.log('arestas post->post: %d (destinos distintos: %d) | media por post: %s',
  totalArestas, destinosDistintos, (totalArestas / slugs.length).toFixed(2));
if (ancorasUrl.length) {
  console.log('\nancoras que sao a propria URL (nao descrevem o destino): %d', ancorasUrl.length);
  for (const a of ancorasUrl.slice(0, 8)) console.log('  %s: %s', a.arquivo, a.detalhe);
  if (ancorasUrl.length > 8) console.log('  ... e mais %d', ancorasUrl.length - 8);
}
console.log('posts sem link de entrada: %d | posts sem link de saida: %d', orfaos.length, semSaida.length);

if (orfaos.length) console.log('\nsem entrada:\n  ' + orfaos.join('\n  '));
if (semSaida.length) console.log('\nsem saida:\n  ' + semSaida.join('\n  '));

if (erros.length) {
  const porTipo = erros.reduce((acc, e) => ((acc[e.tipo] = (acc[e.tipo] ?? 0) + 1), acc), {});
  console.error('\nERROS: %d', erros.length);
  for (const [tipo, n] of Object.entries(porTipo)) console.error('  %s %d', tipo.padEnd(24), n);
  console.error('');
  for (const e of erros) console.error('  [%s] %s: %s', e.tipo, e.arquivo, e.detalhe);
  if (!SOMENTE_RELATORIO) process.exit(1);
} else {
  console.log('\nNenhum erro de malha: 0 destino inexistente, 0 nofollow interno, 0 ancora generica, 0 URL absoluta interna.');
}
