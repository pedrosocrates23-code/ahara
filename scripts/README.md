# Scripts de indexação

## IndexNow (Bing, Yandex, Seznam, Naver, Mojeek)

Notifica buscadores compatíveis com IndexNow sobre URLs novas/atualizadas.
**O Google NÃO participa.**

### Setup (1x só)

O arquivo-chave já está em `public/69aabca2f983481c9da75af8c25d2160.txt`.
Depois do deploy, confira que `https://aharabr.com.br/69aabca2f983481c9da75af8c25d2160.txt`
responde com o mesmo conteúdo. Se não, o IndexNow rejeita (erro 422).

### Uso

```bash
# Submete todas as 8 rotas
npm run indexnow

# Submete rotas específicas (1 ou mais)
node scripts/indexnow.mjs /produtos/ /contato/
```

### Quando disparar

- Depois do primeiro deploy na produção
- Quando publicar um novo post no blog
- Quando atualizar um preço ou informação relevante de produto
- Em CI/CD: pós-deploy hook no Vercel (build command ou webhook)

---

## Google

### Opção 1 (recomendada): submeter sitemap no Search Console

1. Acesse https://search.google.com/search-console
2. Adicione a propriedade `https://aharabr.com.br`
3. Verifique (via DNS TXT ou meta tag — o DNS funciona melhor com Cloudflare)
4. Em "Sitemaps", adicione: `sitemap-index.xml`
5. Pronto. O Google rastreia e indexa sozinho, respeitando suas prioridades.

### Opção 2: Google Indexing API

⚠ **Oficialmente só é aceito para `JobPosting` e `BroadcastEvent`.**
Usar para batata chips é fora de spec e pode gerar warning/ban da API.
Se quiser fazer mesmo assim, crie um service account no Google Cloud com
o papel "Owner" no Search Console e use `googleapis` com `indexing` API.
Não está incluído aqui por padrão.

---

## IndexNow em mais endpoints

`api.indexnow.org` já repassa para todos os motores IndexNow-compliant.
Não é necessário enviar separadamente para Bing/Yandex/etc.
