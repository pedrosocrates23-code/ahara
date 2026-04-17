/**
 * Otimiza imagens criticas:
 * - public/logo.png (730x342 PNG 122KB) -> public/logo.webp (300x140 WebP ~10KB)
 * - public/images/hero-chips.webp (220KB) -> recompressa in-place (~80KB)
 *
 * Uso:  node scripts/optimize-images.mjs
 *
 * Rode depois de atualizar a imagem original. Os arquivos gerados devem
 * ser commitados.
 */

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('public');

async function size(file) {
  const { size } = await fs.stat(file);
  return `${(size / 1024).toFixed(1)}KB`;
}

async function logoToWebp() {
  const src = path.join(ROOT, 'logo.png');
  const dst = path.join(ROOT, 'logo.webp');

  const before = await size(src);
  await sharp(src)
    .resize({ width: 300, height: 140, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, effort: 6 })
    .toFile(dst);
  const after = await size(dst);

  console.log(`✔ logo.png (${before}) -> logo.webp (${after})`);
}

async function heroRecompress() {
  const file = path.join(ROOT, 'images', 'hero-chips.webp');
  const before = await size(file);

  // Le o arquivo pra buffer antes, pra sharp nao segurar lock no Windows
  const src = await fs.readFile(file);
  const out = await sharp(src)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toBuffer();
  await fs.writeFile(file, out);
  const after = await size(file);
  console.log(`✔ hero-chips.webp (${before}) -> (${after})`);
}

async function iconsToWebp() {
  const dir = path.join(ROOT, 'images', 'icons');
  const files = await fs.readdir(dir);
  const pngs = files.filter((f) => f.toLowerCase().endsWith('.png'));

  for (const f of pngs) {
    const src = path.join(dir, f);
    const dst = path.join(dir, f.replace(/\.png$/i, '.webp'));

    const before = await size(src);
    const buf = await fs.readFile(src);
    await sharp(buf)
      .resize({ width: 400, height: 400, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, effort: 6 })
      .toFile(dst);
    await fs.rm(src);
    const after = await size(dst);
    console.log(`✔ ${f} (${before}) -> ${path.basename(dst)} (${after})`);
  }
}

async function bowlRecompress() {
  const file = path.join(ROOT, 'images', 'chips-bowl-2.webp');
  try {
    const before = await size(file);
    const src = await fs.readFile(file);
    const out = await sharp(src)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toBuffer();
    await fs.writeFile(file, out);
    const after = await size(file);
    console.log(`✔ chips-bowl-2.webp (${before}) -> (${after})`);
  } catch (e) {
    console.log(`(skip chips-bowl-2.webp: ${e.message})`);
  }
}

async function main() {
  console.log('Otimizando imagens...');
  await logoToWebp();
  await heroRecompress();
  await bowlRecompress();
  await iconsToWebp();
  console.log('Pronto.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
