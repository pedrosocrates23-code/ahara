/**
 * Le o XLSX do redator e gera um arquivo .mdx por artigo em
 * src/content/blog/<slug>.mdx. Astro carrega via Content Collections
 * (ver src/content.config.ts).
 *
 * Uso: node scripts/import-blog.mjs [caminho-para-xlsx]
 *
 * Padrao: C:/sites/redator-4.0/output/ahara/ahara-output-2026-04-17.xlsx
 */

import XLSX from 'xlsx';
import fs from 'node:fs/promises';
import path from 'node:path';

const XLSX_PATH = process.argv[2] || 'C:/sites/redator-4.0/output/ahara/ahara-output-2026-04-17.xlsx';
const OUT_DIR = path.resolve('src/content/blog');

// Remove travessoes (— en-dash, – em-dash) por hifen simples.
// Normaliza reticencias (…) tambem.
const sanitize = (s) =>
  String(s || '')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .trim();

// Escape YAML de string simples (aspas duplas como delimitador)
const yamlStr = (s) => `"${sanitize(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const wb = XLSX.readFile(XLSX_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

// Garante pasta limpa
await fs.mkdir(OUT_DIR, { recursive: true });

// Remove qualquer .mdx existente para evitar orfaos de imports antigos
const existing = (await fs.readdir(OUT_DIR)).filter((f) => f.endsWith('.mdx'));
for (const f of existing) await fs.rm(path.join(OUT_DIR, f));

const pubDate = new Date().toISOString();
let written = 0;

for (const r of rows) {
  const slug = String(r.slug).trim();
  if (!slug) continue;

  const h1 = sanitize(r.h1);
  const meta = sanitize(r.meta_description);
  const keyword = sanitize(r.keyword);
  const sumario = sanitize(r.sumario_html);
  const texto = sanitize(r.texto_html);
  const palavras = Number(r.palavras_totais) || 0;
  const ctas = Number(r.ctas_internos) || 0;

  // Frontmatter YAML + corpo HTML (MDX aceita HTML bruto como conteudo)
  const mdx = `---
h1: ${yamlStr(h1)}
keyword: ${yamlStr(keyword)}
meta_description: ${yamlStr(meta)}
sumario_html: ${yamlStr(sumario)}
palavras_totais: ${palavras}
ctas_internos: ${ctas}
pub_date: ${yamlStr(pubDate)}
---

${texto}
`;

  const file = path.join(OUT_DIR, `${slug}.mdx`);
  await fs.writeFile(file, mdx, 'utf-8');
  written++;
  console.log(`  ✔ ${slug}.mdx (${palavras} palavras)`);
}

console.log(`\n✔ ${written} posts gerados em ${OUT_DIR}`);
