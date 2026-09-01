// Configurações centralizadas do site

export const site = {
  name: 'Ahara',
  legalName: 'AHARA INDÚSTRIA E COMÉRCIO DE BATATAS SNACKS LTDA',
  cnpj: '63.900.901/0001-50',
  founder: 'João Amaro',
  // Registro publico do CNPJ 63.900.901/0001-50: data_inicio_atividade = 2025-12-02.
  foundingDate: '2025-12-02',
  // Ano de copyright do SITE, não da empresa. Os 89 artigos publicados são todos de
  // 2026; amarrar este campo a foundingDate publicava 2025 num conteúdo de 2026.
  copyrightYear: '2026',
  // Confirmado com o cliente em 01/09/2026: não existe caixa no domínio próprio, e
  // este é o endereço oficial. Fica registrado que um endereço em @aharabr.com.br
  // reforçaria a legitimidade da entidade, que já declara CNPJ, endereço e CEP
  // conferidos no registro público. Não é bloqueio, é oportunidade.
  email: 'sac.aharabr@gmail.com',
  url: 'https://aharabr.com.br',
  location: 'Brasília/DF',
  currency: 'BRL',
  geo: { latitude: -15.837, longitude: -48.024 },

  address: {
    street: 'ADE Águas Claras, Conjunto 16, Lote 12',
    city: 'Brasília',
    state: 'DF',
    country: 'Brasil',
    // CEP conforme o registro publico do CNPJ 63.900.901/0001-50.
    postalCode: '71988-720',
    full: 'ADE Águas Claras, Conjunto 16, Lote 12 – Brasília/DF – Brasil',
    mapsQuery: 'ADE+Aguas+Claras+Conjunto+16+Lote+12+Brasilia+DF+Brasil',
  },

  // ATENÇÃO ao trocar o telefone: o número abaixo tem DDD 31 (Minas Gerais) numa
  // empresa sediada em Brasília, o que parece defeito mas não é invenção do site.
  // A consulta ao CNPJ 63.900.901/0001-50 em 31/08/2026 devolveu exatamente
  // ddd_telefone_1 = 3198985678, ou seja, é o número do registro público.
  //
  // O cliente confirmou em 01/09/2026 que ele é PROVISÓRIO. Quando o número do DF
  // chegar, troque AQUI e só aqui: os 21 pontos de uso, o rodapé, o botão flutuante,
  // o menu e os três blocos de JSON-LD derivam todos deste campo. Atualize também o
  // cadastro na Receita, senão o site passa a divergir do registro público, que é a
  // fonte que sustenta a identidade da entidade.
  whatsapp: {
    number: '553198985678',             // +55 31 99898-5678 (provisório, confirmado pelo cliente)
    display: '(31) 99898-5678',
    url: 'https://wa.me/553198985678',
    link: (message: string) =>
      `https://wa.me/553198985678?text=${encodeURIComponent(message)}`,
  },

  hours: {
    weekdays: 'Seg a Sex: 8h às 18h',
    saturday: 'Sáb: 8h às 12h',
  },

  regions: ['Riacho Fundo 1', 'Núcleo Bandeirante', 'Taguatinga', 'Asa Sul', 'Sudoeste'],

  // sameAs — adicionar URLs reais dos perfis públicos da Ahara para consolidação no Knowledge Graph do Google.
  // Exemplos: perfil do Instagram, página do Facebook, Google Maps (URL do lugar), LinkedIn, Wikidata.
  // Cada URL adicionada aqui fortalece a identidade da entidade Ahara nos resultados de busca.
  sameAs: [
    // 'https://www.instagram.com/aharabr',        // TODO: confirmar handle real
    // 'https://www.facebook.com/aharabr',         // TODO: confirmar handle real
    // 'https://maps.app.goo.gl/XXXXXXXX',         // TODO: URL do Google Maps Place
    // 'https://www.linkedin.com/company/aharabr', // TODO: confirmar handle real
  ] as string[],

  pricing: {
    minOrder: 5,
    baseKg: 65,
    deliveryMin: 15,
    // Tabela B2B pública e progressiva (diferencial declarado no posicionamento da marca)
    discountTiers: [
      { kg: 25, discountPercent: 5 },
      { kg: 50, discountPercent: 8 },
      { kg: 75, discountPercent: 10 },
      { kg: 100, discountPercent: 12 },
    ],
    // Gramaturas comercializadas (SKU único — sabor tradicional)
    packagings: [
      { weightGrams: 50, label: '50g', sku: 'NIKO-50G' },
      { weightGrams: 150, label: '150g', sku: 'NIKO-150G' },
      { weightGrams: 500, label: '500g', sku: 'NIKO-500G' },
    ],
  },

  // Canal do formulário de contato.
  //
  // VAZIO É O ESTADO CORRETO, não uma pendência. Confirmado com o cliente em
  // 01/09/2026: o formulário deve ir direto para o WhatsApp. Com este campo vazio,
  // src/pages/contato.astro monta a mensagem com nome, WhatsApp, tipo e texto do
  // visitante e abre a conversa, sem intermediário e sem planilha.
  //
  // O valor anterior era o texto de substituição 'REPLACE_ME_APPS_SCRIPT_URL', que
  // funcionava igual (o mesmo ramo de código trata os dois casos) mas se parecia com
  // configuração esquecida, e por isso foi diagnosticado mais de uma vez como
  // formulário quebrado.
  //
  // Só preencha se um dia o envio passar a gravar em planilha via Apps Script
  // (ver scripts/apps-script-contato.gs); nesse caso o WhatsApp vira o plano B.
  formEndpoint: '',
} as const;

// Fotos reais do produto (batata chips). Só mantemos as 2 fotos aprovadas.
export const img = {
  heroChips:    '/images/hero-chips.webp',   // close-up dourado
  chipsBowl:    '/images/chips-bowl-2.webp', // chips sobre fundo claro
} as const;

// Ícones decorativos (batata-estilizados).
export const icons = {
  chip1:    '/images/icons/icon-1.webp',
  chip2:    '/images/icons/icon-2.webp',
  chip3:    '/images/icons/icon-3.webp',
  chip4:    '/images/icons/icon-4.webp',
  shine:    '/images/icons/icon-shine.webp',
  delivery: '/images/icons/icon-delivery.webp',
} as const;
