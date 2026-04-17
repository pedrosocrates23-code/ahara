/**
 * Google Search Console - submete sitemap usando service account.
 *
 * Requer:
 *   1. Service account JSON em ./secrets/gsc-key.json (ou GOOGLE_APPLICATION_CREDENTIALS)
 *   2. A propriedade aharabr.com.br adicionada no Search Console
 *   3. O email do service account (fit-82@fits-493115.iam.gserviceaccount.com)
 *      adicionado como "Proprietario" ou "Usuario delegado" no Search Console
 *
 * Uso:
 *   node scripts/google-search-console.mjs submit         -> submete sitemap
 *   node scripts/google-search-console.mjs list           -> lista sitemaps ja submetidos
 *   node scripts/google-search-console.mjs inspect /url/  -> status de indexação (beta)
 */

import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://aharabr.com.br/';
const SITEMAP = 'https://aharabr.com.br/sitemap-index.xml';
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || './secrets/gsc-key.json';

async function getAuth() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`✖ Credencial nao encontrada em ${KEY_FILE}`);
    console.error('   Baixe a chave JSON do service account em https://console.cloud.google.com/iam-admin/serviceaccounts');
    console.error('   e salve como ./secrets/gsc-key.json (ignorado pelo git).');
    process.exit(1);
  }

  return new google.auth.GoogleAuth({
    keyFile: path.resolve(KEY_FILE),
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
}

async function submit() {
  const auth = await getAuth();
  const webmasters = google.webmasters({ version: 'v3', auth });

  console.log(`Submetendo sitemap: ${SITEMAP}`);
  console.log(`Para propriedade: ${SITE}`);

  try {
    await webmasters.sitemaps.submit({ siteUrl: SITE, feedpath: SITEMAP });
    console.log('✔ Sitemap submetido com sucesso.');
  } catch (err) {
    console.error('✖ Erro:', err.message);
    if (err.code === 403) {
      console.error('   A conta de servico precisa ser adicionada como Proprietario no Search Console.');
    }
    process.exit(1);
  }
}

async function list() {
  const auth = await getAuth();
  const webmasters = google.webmasters({ version: 'v3', auth });
  const res = await webmasters.sitemaps.list({ siteUrl: SITE });
  console.log('Sitemaps registrados:');
  console.log(JSON.stringify(res.data, null, 2));
}

async function inspect(url) {
  const auth = await getAuth();
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const res = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url.startsWith('http') ? url : `https://aharabr.com.br${url}`,
      siteUrl: SITE,
      languageCode: 'pt-BR',
    },
  });
  console.log(JSON.stringify(res.data, null, 2));
}

const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === 'submit') await submit();
else if (cmd === 'list') await list();
else if (cmd === 'inspect' && arg) await inspect(arg);
else {
  console.log('Uso:');
  console.log('  node scripts/google-search-console.mjs submit');
  console.log('  node scripts/google-search-console.mjs list');
  console.log('  node scripts/google-search-console.mjs inspect /produtos/');
  process.exit(1);
}
