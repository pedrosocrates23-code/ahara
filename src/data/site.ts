// Configurações centralizadas do site

export const site = {
  name: 'Ahara',
  legalName: 'AHARA INDÚSTRIA E COMÉRCIO DE BATATAS SNACKS LTDA',
  cnpj: '63.900.901/0001-50',
  founder: 'João Amaro',
  foundingDate: '2024',
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
    full: 'ADE Águas Claras, Conjunto 16, Lote 12 – Brasília/DF – Brasil',
    mapsQuery: 'ADE+Aguas+Claras+Conjunto+16+Lote+12+Brasilia+DF+Brasil',
  },

  whatsapp: {
    number: '553198985678',             // +55 31 99898-5678 (provisório)
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

  // sameAs — preencher URLs reais quando publicadas (Instagram, Facebook, LinkedIn, Wikidata, Google Maps CID)
  sameAs: [] as string[],

  pricing: {
    minOrder: 5,
    baseKg: 55,
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

  // URL do Apps Script Web App que recebe o formulario de contato
  // e anexa linhas em uma Google Sheet (ver scripts/apps-script-contato.gs).
  // Troque este valor pelo URL "...script.google.com/macros/s/AKfycb.../exec"
  // depois do deploy do Apps Script.
  formEndpoint: 'REPLACE_ME_APPS_SCRIPT_URL',
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
