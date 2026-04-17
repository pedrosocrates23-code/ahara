/**
 * Le o XLSX do redator e gera src/content/blog/posts.json
 * (estrutura consumida pela rota dinamica /blog/[slug].astro).
 *
 * Uso: node scripts/import-blog.mjs [caminho-para-xlsx]
 *
 * Padrao de caminho: C:/sites/redator-4.0/output/ahara/ahara-output-2026-04-17.xlsx
 */

import XLSX from 'xlsx';
import fs from 'node:fs/promises';
import path from 'node:path';

const XLSX_PATH = process.argv[2] || 'C:/sites/redator-4.0/output/ahara/ahara-output-2026-04-17.xlsx';
const OUT_DIR = path.resolve('src/content/blog');
const OUT_FILE = path.join(OUT_DIR, 'posts.json');

const wb = XLSX.readFile(XLSX_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

const posts = rows.map((r) => ({
  slug: String(r.slug).trim(),
  h1: String(r.h1).trim(),
  keyword: String(r.keyword).trim(),
  meta_description: String(r.meta_description).trim(),
  sumario_html: String(r.sumario_html || '').trim(),
  texto_html: String(r.texto_html || '').trim(),
  palavras_totais: Number(r.palavras_totais) || 0,
  ctas_internos: Number(r.ctas_internos) || 0,
  pub_date: new Date().toISOString(),
}));

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT_FILE, JSON.stringify(posts, null, 2), 'utf-8');

console.log(`✔ ${posts.length} posts exportados para ${OUT_FILE}`);
posts.forEach((p) => console.log(`  - /blog/${p.slug}/  (${p.palavras_totais} palavras)`));
