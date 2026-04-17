/**
 * Google Indexing API - push individual de URLs.
 *
 * !!! AVISO IMPORTANTE !!!
 * A Indexing API oficialmente só aceita conteúdo JobPosting ou BroadcastEvent.
 * Usar para paginas gerais (como batata chips) é fora da policy oficial do Google
 * e pode gerar quota reduzida, warning ou bloqueio da conta de servico.
 * Use por sua conta e risco. A opcao segura e o sitemap no Search Console.
 *
 * Requer:
 *   1. Service account JSON em ./secrets/gsc-key.json (ou GOOGLE_APPLICATION_CREDENTIALS)
 *   2. Indexing API habilitada no projeto GCP
 *   3. Conta de servico adicionada como Proprietario no Search Console
 *
 * Uso:
 *   node scripts/google-indexing-api.mjs              -> publica todas rotas
 *   node scripts/google-indexing-api.mjs /produtos/   -> 1 ou mais rotas
 *   node scripts/google-indexing-api.mjs --delete /rota/  -> remove do indice
 */

import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';

const HOST = 'https://aharabr.com.br';
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || './secrets/gsc-key.json';

const DEFAULT_ROUTES = [
  '/',
  '/sobre/',
  '/produtos/',
  '/blog/',
  '/contato/',
  '/para-revendedores/',
  '/para-comercios/',
  '/para-eventos/',
];

async function getAuth() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`✖ Credencial nao encontrada em ${KEY_FILE}`);
    process.exit(1);
  }
  return new google.auth.GoogleAuth({
    keyFile: path.resolve(KEY_FILE),
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

async function notify(url, type) {
  const auth = await getAuth();
  const indexing = google.indexing({ version: 'v3', auth });
  const absoluteUrl = url.startsWith('http') ? url : `${HOST}${url}`;

  const res = await indexing.urlNotifications.publish({
    requestBody: {
      url: absoluteUrl,
      type: type === 'delete' ? 'URL_DELETED' : 'URL_UPDATED',
    },
  });

  console.log(`  ${type === 'delete' ? '✖' : '✔'} ${absoluteUrl} -> ${res.status}`);
  return res.data;
}

async function run() {
  const args = process.argv.slice(2);
  const isDelete = args.includes('--delete');
  const urls = args.filter((a) => a !== '--delete');
  const routes = urls.length > 0 ? urls : DEFAULT_ROUTES;

  console.warn('⚠ Lembrete: Indexing API oficialmente aceita so JobPosting/BroadcastEvent.');
  console.warn(`   Operacao: ${isDelete ? 'DELETE' : 'UPDATE'}  |  URLs: ${routes.length}`);
  console.log('---');

  for (const route of routes) {
    try {
      await notify(route, isDelete ? 'delete' : 'update');
    } catch (err) {
      console.error(`  ✖ ${route} -> ${err.message}`);
    }
  }
}

run().catch((err) => {
  console.error('✖ Erro fatal:', err.message);
  process.exit(1);
});
