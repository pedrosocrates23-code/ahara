// Regra única de "post publicado", usada por TODAS as listagens e rotas do blog.
//
// O site é estático: um post com pub_date no futuro já está no repositório, mas só vira
// página (e só aparece em listas, links e sitemap) no primeiro build depois que a data
// chega. Os builds de segunda, quarta e sexta são disparados pela fila de publicação
// (.github/workflows/fila-publicacao.yml e api/publicar-fila.js).
//
// Antes deste arquivo, a home, as páginas /para-* e a página do autor filtravam só por
// draft. Um post agendado aparecia nessas listas como link para uma rota que ainda não
// existia (404). Toda listagem nova de posts deve usar esta função.
//
// AHARA_PUBLISH_ALL=1 publica tudo (pré-visualização local do lote inteiro).

type DadosPost = { draft?: boolean; pub_date: Date };

export function isPublished(data: DadosPost, agora: number = Date.now()): boolean {
  if (data.draft) return false;
  if (process.env.AHARA_PUBLISH_ALL === '1') return true;
  return data.pub_date.getTime() <= agora;
}
