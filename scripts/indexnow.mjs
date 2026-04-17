/**
 * IndexNow submission script.
 *
 * Notifica Bing, Yandex, Seznam, Naver e Mojeek de novas/atualizadas URLs.
 * O Google NÃO participa do IndexNow - submeta o sitemap no Search Console.
 *
 * Uso:
 *   node scripts/indexnow.mjs              -> envia todas as URLs
 *   node scripts/indexnow.mjs /contato/    -> envia URLs específicas
 *
 * Pré-requisitos:
 *   - Site deve estar live em HOST com o arquivo KEY.txt acessível em /{KEY}.txt
 *   - O arquivo-chave já existe em public/{KEY}.txt
 */

const HOST = 'aharabr.com.br';
const KEY = '69aabca2f983481c9da75af8c25d2160';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Rotas fixas + posts do blog (scan direto de src/content/blog/*.mdx)
import { readdir } from 'node:fs/promises';

const STATIC_ROUTES = [
  '/',
  '/sobre/',
  '/produtos/',
  '/blog/',
  '/contato/',
  '/para-revendedores/',
  '/para-comercios/',
  '/para-eventos/',
];

async function loadBlogRoutes() {
  try {
    const files = await readdir('./src/content/blog');
    return files
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => `/blog/${f.replace(/\.mdx$/, '')}/`);
  } catch {
    return [];
  }
}

const DEFAULT_ROUTES = [...STATIC_ROUTES, ...(await loadBlogRoutes())];

// Endpoint preferencial (repassa para Bing, Yandex e demais)
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

async function submit(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.map((u) => (u.startsWith('http') ? u : `https://${HOST}${u}`)),
  };

  console.log(`Enviando ${urls.length} URL(s) para IndexNow...`);
  console.log('URLs:', body.urlList);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`Status: ${res.status} ${res.statusText}`);
  if (text) console.log('Resposta:', text);

  if (res.status === 200 || res.status === 202) {
    console.log('✔ URLs submetidas com sucesso.');
  } else if (res.status === 422) {
    console.error('✖ Erro 422: validação falhou (KEY_LOCATION inacessível, domínio errado, ou URL fora do HOST).');
    console.error('   Verifique se o site está live e o arquivo KEY está acessível em:', KEY_LOCATION);
    process.exit(1);
  } else {
    console.error('✖ Erro inesperado. Revise o retorno acima.');
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const routes = args.length > 0 ? args : DEFAULT_ROUTES;
submit(routes).catch((err) => {
  console.error('✖ Erro de rede:', err.message);
  process.exit(1);
});
