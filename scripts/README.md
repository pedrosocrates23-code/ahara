# Scripts de indexação

## Visão geral

| Script | API | Motor de busca |
|---|---|---|
| `npm run indexnow` | IndexNow | Bing, Yandex, Seznam, Naver, Mojeek |
| `npm run gsc:submit` | Google Search Console API | Google (caminho oficial) |
| `npm run google:index` | Google Indexing API | Google (fora de spec - ver aviso) |

---

## 1. IndexNow (recomendado para Bing/Yandex)

O arquivo-chave já está em `public/69aabca2f983481c9da75af8c25d2160.txt`.
Depois do deploy, confira que `https://aharabr.com.br/69aabca2f983481c9da75af8c25d2160.txt`
responde com o mesmo conteúdo. Se não, o IndexNow rejeita (erro 422).

```bash
npm run indexnow                       # submete todas as 8 rotas
node scripts/indexnow.mjs /contato/    # rotas específicas
```

---

## 2. Google Search Console API (recomendado para Google)

### Setup do service account

O email do service account configurado: `fit-82@fits-493115.iam.gserviceaccount.com`

**Passo a passo:**

1. **Google Cloud Console** → abra o projeto `fits-493115`
2. **IAM** → confirme que o service account `fit-82` existe
3. **Service Accounts** → selecione `fit-82` → **Keys** → **Add key** → **Create new key** → **JSON**
4. Salve o arquivo baixado como `D:/ia/Projeto Ahara/secrets/gsc-key.json`
   (a pasta `secrets/` já está no `.gitignore`)
5. **APIs & Services** → habilite:
   - [Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com)
   - [Indexing API](https://console.cloud.google.com/apis/library/indexing.googleapis.com) (opcional)
6. **Google Search Console** → https://search.google.com/search-console
7. Adicione a propriedade `https://aharabr.com.br` (DNS TXT verifica mais rápido com Cloudflare)
8. Na propriedade → **Configurações** → **Usuarios e permissoes** → **Adicionar usuario**
9. Email: `fit-82@fits-493115.iam.gserviceaccount.com` — permissao: **Proprietario**

### Uso

```bash
npm run gsc:submit                    # submete sitemap
npm run gsc:list                      # lista sitemaps registrados
npm run gsc:inspect -- /produtos/     # status de indexação de uma URL
```

---

## 3. Google Indexing API (fora de spec)

⚠ **Oficialmente aceita só `JobPosting` e `BroadcastEvent`.**
Usar para batata chips é fora da policy do Google e pode gerar:
- Quota reduzida (cota diária de ~200 req, mas sujeita a corte)
- Warning no console
- Em casos extremos, bloqueio da conta de servico

Se quiser fazer mesmo assim (várias pessoas usam, e muita gente não tem problema):

```bash
npm run google:index                       # push de todas as rotas (URL_UPDATED)
node scripts/google-indexing-api.mjs /produtos/
node scripts/google-indexing-api.mjs --delete /rota-removida/
```

Pré-requisitos: mesma conta de servico do GSC, mais Indexing API habilitada.

---

## 4. Quando disparar

- **Primeiro deploy**: rode `npm run indexnow` e `npm run gsc:submit` uma vez
- **Blog novo / atualização importante**: rode `npm run indexnow` com as URLs específicas
- **Em CI/CD** (Vercel post-deploy hook): idealmente rode `indexnow` automaticamente
- **Google**: submeta sitemap 1x só; depois o Google recrawleja sozinho seguindo prioridades

---

## 5. Arquivo de credencial

A pasta `secrets/` e padrões `*.key.json` / `gsc-key.json` estão no `.gitignore`.
**NUNCA** commite a chave JSON do service account.
