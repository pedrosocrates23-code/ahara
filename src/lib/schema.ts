/**
 * Schema.org @graph builder — Ahara
 *
 * Padrão Jarno van Driel: um único <script type="application/ld+json"> com @graph
 * contendo todas as entidades inter-conectadas via @id. Elimina duplicação,
 * resolve conflitos de identidade e facilita o trabalho do Knowledge Graph do Google.
 *
 * Ver: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */
import { site } from '@/data/site';

const BASE = site.url;
const ORG_ID = `${BASE}/#organization`;
const WEBSITE_ID = `${BASE}/#website`;
const LOGO_ID = `${BASE}/#logo`;
const BRAND_ID = `${BASE}/#brand-niko`;
const PRODUCT_ID = `${BASE}/#product-batata-chips`;

// site.regions são Regiões Administrativas do Distrito Federal — subdivisões do
// município, não cidades. schema.org/City é "A city or town"; schema.org/
// AdministrativeArea é "A geographical region, typically under the jurisdiction
// of a particular government" — que é exatamente o que uma RA é. Por isso todo
// areaServed/eligibleRegion derivado de site.regions usa AdministrativeArea.

// ──────────────────────────────────────────────────────────────────────────────
// CORE NODES — Organization + WebSite + Logo (presentes em TODAS as páginas)
// ──────────────────────────────────────────────────────────────────────────────

export function organizationNode() {
  const maxDiscount = Math.max(...site.pricing.discountTiers.map((t) => t.discountPercent));
  const lowPrice = +(site.pricing.baseKg * (1 - maxDiscount / 100)).toFixed(2);

  return {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': ORG_ID,
    name: site.name,
    legalName: site.legalName,
    description:
      'Indústria de batatas chips artesanais com sede em Brasília/DF e envio para todo o Brasil. Atendimento B2B para revendedores, comércios, eventos e food service — entrega com frota própria no DF e envio nacional via transportadora.',
    url: BASE,
    logo: { '@id': LOGO_ID },
    // taxID recebe o CNPJ, que é o identificador fiscal da empresa. `vatID` NÃO é
    // sinônimo: designa o número de imposto sobre valor agregado, cujo análogo no
    // Brasil seria a Inscrição Estadual. Declarar o CNPJ nos dois campos afirmava um
    // dado falso, então vatID fica de fora até a Inscrição Estadual real ser informada.
    taxID: site.cnpj,
    founder: {
      '@type': 'Person',
      '@id': `${BASE}/autor/joao-amaro/#person`,
      name: site.founder,
    },
    foundingDate: site.foundingDate,
    foundingLocation: {
      '@type': 'Place',
      name: 'Brasília, DF, Brasil',
    },
    // A empresa é a Ahara e a linha de produto é a Niko (confirmado pelo cliente em
    // 01/09/2026). Sem esta aresta o nó Brand ficava solto no grafo: a marca era
    // declarada em cada página e nada dizia a quem ela pertence. `brand` tem domínio
    // Organization e range Brand, então é a propriedade exata para afirmar o vínculo.
    brand: { '@id': BRAND_ID },
    knowsAbout: [
      'Batatas chips artesanais',
      'Food service',
      'Distribuição B2B',
      'Envio nacional de snacks',
      'Variedade Marquise',
      'Variedade Atlantic',
      'Boas Práticas de Fabricação',
    ],
    telephone: `+${site.whatsapp.number}`,
    email: site.email,
    priceRange: `R$ ${lowPrice.toFixed(2).replace('.', ',')} a R$ ${site.pricing.baseKg.toFixed(2).replace('.', ',')} por kg`,
    currenciesAccepted: site.currency,
    paymentAccepted: 'Cash, PIX, Bank Transfer',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: 'Brasília',
      addressRegion: 'DF',
      postalCode: site.address.postalCode,
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    hasMap: `https://maps.google.com/maps?q=${site.address.mapsQuery}`,
    areaServed: [
      ...site.regions.map((region) => ({ '@type': 'AdministrativeArea', name: region })),
      { '@type': 'AdministrativeArea', name: 'Distrito Federal' },
      { '@type': 'Country', name: 'Brasil' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '12:00',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: `+${site.whatsapp.number}`,
        contactType: 'sales',
        areaServed: 'BR',
        availableLanguage: ['Portuguese', 'pt-BR'],
      },
    ],
    sameAs: site.sameAs,
  };
}

export function logoNode() {
  return {
    '@type': 'ImageObject',
    '@id': LOGO_ID,
    url: `${BASE}/logo.png`,
    contentUrl: `${BASE}/logo.png`,
    caption: `Logo ${site.name}`,
    width: 512,
    height: 512,
  };
}

export function websiteNode() {
  // copyrightYear é propriedade da OBRA (o site), não da empresa: schema.org define
  // como "the year during which the claimed copyright for the CreativeWork was first
  // asserted". Derivá-lo de site.foundingDate misturava as duas coisas e, depois que
  // foundingDate virou a data ISO do registro do CNPJ ('2025-12-02'), publicava 2025
  // num site cujo conteúdo é inteiramente de 2026. Fica desacoplado, com valor próprio.
  const year = /^(\d{4})/.exec(site.copyrightYear)?.[1];

  const node: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: BASE,
    name: site.name,
    description: 'Batatas chips artesanais — sede em Brasília/DF, envio para todo o Brasil',
    inLanguage: 'pt-BR',
    publisher: { '@id': ORG_ID },
    copyrightHolder: { '@id': ORG_ID },
  };
  if (year) node.copyrightYear = Number(year);
  return node;
}

// ──────────────────────────────────────────────────────────────────────────────
// PAGE NODES — WebPage + Breadcrumb (gerados por página)
// ──────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface WebPageOptions {
  pathname: string;
  title: string;
  description: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'ItemPage';
  image?: string;
  breadcrumbs?: BreadcrumbItem[];
  datePublished?: string;
  dateModified?: string;
}

export function webPageNode(opts: WebPageOptions) {
  const pageId = `${BASE}${opts.pathname}#webpage`;
  const node: Record<string, unknown> = {
    '@type': opts.type ?? 'WebPage',
    '@id': pageId,
    url: `${BASE}${opts.pathname}`,
    name: opts.title,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'pt-BR',
  };
  if (opts.image) {
    node.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: opts.image.startsWith('http') ? opts.image : `${BASE}${opts.image}`,
    };
  }
  if (opts.datePublished) node.datePublished = opts.datePublished;
  if (opts.dateModified) node.dateModified = opts.dateModified;
  if (opts.breadcrumbs && opts.breadcrumbs.length > 0) {
    node.breadcrumb = { '@id': `${pageId}-breadcrumb` };
  }
  return node;
}

export function breadcrumbNode(pathname: string, items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${BASE}${pathname}#webpage-breadcrumb`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${BASE}${it.url}`,
    })),
  };
}

// Auto-gera breadcrumbs a partir do pathname (fallback quando a página não passa custom)
export function autoBreadcrumbs(pathname: string, pageTitle: string): BreadcrumbItem[] {
  const parts = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ name: 'Início', url: '/' }];
  let acc = '';
  parts.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLast = i === parts.length - 1;
    const name = isLast
      ? pageTitle
      : seg
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ name, url: `${acc}/` });
  });
  return items;
}

// ──────────────────────────────────────────────────────────────────────────────
// COMMERCIAL NODES — PriceSpecification, OfferCatalog, Service
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Tabela B2B Ahara → OfferCatalog com 4 tiers (5%/8%/10%/12%) — diferencial declarado.
 */
export function discountOfferCatalog(catalogId: string = `${BASE}/#offer-catalog-b2b`) {
  return {
    '@type': 'OfferCatalog',
    '@id': catalogId,
    name: 'Tabela de Preços B2B — Batata Chips Artesanal Ahara',
    description:
      'Política comercial pública e progressiva. Pedido mínimo 5kg. Desconto progressivo por volume de 5% (25kg) até 12% (100kg+).',
    // `position` tem domainIncludes CreativeWork e ListItem — Offer não é nem herda de
    // nenhum dos dois, então a propriedade estava fora de domínio nos 4 tiers. A ordem
    // do catálogo já é a ordem do array, e nenhum rich result do Google lê esse campo.
    itemListElement: site.pricing.discountTiers.map((tier) => ({
      '@type': 'Offer',
      '@id': `${catalogId}/tier-${tier.kg}`,
      name: `${tier.kg}kg ou mais — ${tier.discountPercent}% de desconto`,
      description: `Desconto progressivo de ${tier.discountPercent}% para pedidos a partir de ${tier.kg}kg`,
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        value: tier.kg,
        unitCode: 'KGM',
        unitText: 'kg',
      },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: site.currency,
        price: +(site.pricing.baseKg * (1 - tier.discountPercent / 100)).toFixed(2),
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: 'KGM',
        },
      },
      seller: { '@id': ORG_ID },
      areaServed: site.regions.map((r) => ({ '@type': 'AdministrativeArea', name: r })),
      availableAtOrFrom: { '@id': ORG_ID },
      businessFunction: 'http://purl.org/goodrelations/v1#Sell',
    })),
  };
}

/**
 * DeliveryChargeSpecification: as 5 regiões com entrega gratuita acima de 15kg.
 */
export function deliverySpec() {
  return {
    '@type': 'DeliveryChargeSpecification',
    '@id': `${BASE}/#delivery-spec`,
    appliesToDeliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet',
    eligibleQuantity: {
      '@type': 'QuantitativeValue',
      minValue: site.pricing.deliveryMin,
      unitCode: 'KGM',
      unitText: 'kg',
    },
    eligibleRegion: site.regions.map((r) => ({
      '@type': 'AdministrativeArea',
      name: r,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Distrito Federal' },
    })),
    price: 0,
    priceCurrency: site.currency,
  };
}

/**
 * Service schema para páginas de audience (revendedores/comércios/eventos).
 */
export interface ServiceOptions {
  id: string;            // ex: `${BASE}/para-revendedores/#service`
  name: string;
  description: string;
  serviceType: string;   // ex: 'Distribuição B2B para revendedores autônomos'
  audienceName: string;  // ex: 'Revendedores autônomos no DF'
  audienceType?: string; // BusinessAudience, EducationalAudience, etc.
  includesCatalog?: boolean;
}

export function serviceNode(opts: ServiceOptions) {
  const node: Record<string, unknown> = {
    '@type': 'Service',
    '@id': opts.id,
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType,
    provider: { '@id': ORG_ID },
    areaServed: site.regions.map((r) => ({ '@type': 'AdministrativeArea', name: r })),
    audience: {
      '@type': opts.audienceType ?? 'BusinessAudience',
      name: opts.audienceName,
      geographicArea: { '@type': 'AdministrativeArea', name: 'Distrito Federal' },
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: site.whatsapp.url,
      // servicePhone tem rangeIncludes ContactPoint, não Text: passar a string do
      // telefone deixava o valor fora do range declarado pelo vocabulário.
      servicePhone: {
        '@type': 'ContactPoint',
        telephone: `+${site.whatsapp.number}`,
        contactType: 'sales',
      },
      availableLanguage: 'pt-BR',
    },
    termsOfService: `${BASE}/politica-de-privacidade/`,
  };
  if (opts.includesCatalog !== false) {
    node.hasOfferCatalog = { '@id': `${BASE}/#offer-catalog-b2b` };
    node.offers = { '@id': `${BASE}/#offer-catalog-b2b` };
  }
  return node;
}

// ──────────────────────────────────────────────────────────────────────────────
// CONTENT NODES — Article, FAQPage
// ──────────────────────────────────────────────────────────────────────────────

export interface FaqItem {
  q: string;
  a: string;
}

export function faqPageNode(pageUrl: string, items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// BRAND NODE — sub-brand Niko vinculado à Organization
// ──────────────────────────────────────────────────────────────────────────────

export function brandNikoNode() {
  return {
    '@type': 'Brand',
    '@id': BRAND_ID,
    name: 'Niko',
    description: 'Linha de batatas chips artesanais produzida pela Ahara em Brasília/DF',
    url: BASE,
    logo: { '@id': LOGO_ID },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// NUTRITION NODE — tabela nutricional por embalagem de referência (25 g)
// ──────────────────────────────────────────────────────────────────────────────

export function nutritionNode() {
  return {
    '@type': 'NutritionInformation',
    servingSize: '25 g',
    calories: '140 kcal',
    carbohydrateContent: '13 g',
    sugarContent: '0 g',
    proteinContent: '2 g',
    fatContent: '9 g',
    saturatedFatContent: '4 g',
    transFatContent: '0 g',
    fiberContent: '1.5 g',
    sodiumContent: '210 mg',
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// HOWTO NODE — processo de compra B2B (home "Como funciona")
// ──────────────────────────────────────────────────────────────────────────────

export function howToBuyNode() {
  return {
    '@type': 'HowTo',
    '@id': `${BASE}/#howto-compra`,
    name: 'Como comprar batatas chips artesanais Ahara',
    description:
      'Processo de compra B2B das batatas chips artesanais Ahara para revendedores, comércios, restaurantes e eventos no Distrito Federal.',
    totalTime: 'PT5M',
    supply: [
      { '@type': 'HowToSupply', name: 'Pedido mínimo de 5 kg' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Pedido mínimo de 5 kg',
        text: `Começamos a atender a partir de ${site.pricing.minOrder}kg (~R$${site.pricing.baseKg * site.pricing.minOrder}). Acessível para testar o produto ou para negócios menores.`,
        url: `${BASE}/#como-funciona`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Desconto progressivo por volume',
        text: `Quanto mais você compra, menos paga. Descontos de ${site.pricing.discountTiers[0].discountPercent}% a ${Math.max(...site.pricing.discountTiers.map((t) => t.discountPercent))}% conforme o volume do pedido, pagamento à vista.`,
        url: `${BASE}/#como-funciona`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Retirada ou entrega',
        text: `Pedidos até ${site.pricing.deliveryMin - 1}kg: retirada em nosso endereço em Brasília/DF. A partir de ${site.pricing.deliveryMin}kg: entrega gratuita nas regiões atendidas do DF. Envio nacional via transportadora.`,
        url: `${BASE}/#como-funciona`,
      },
    ],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// FAQ NODE — perguntas frequentes para home e páginas de audiência
// ──────────────────────────────────────────────────────────────────────────────

export function homeFaqNode() {
  return {
    '@type': 'FAQPage',
    '@id': `${BASE}/#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Qual é o pedido mínimo da Ahara?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `O pedido mínimo é de ${site.pricing.minOrder}kg (~R$${site.pricing.baseKg * site.pricing.minOrder}). Atendemos revendedores, comércios, eventos e food service.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Quais regiões do DF recebem entrega?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Entregamos em ${site.regions.join(', ')}. Para pedidos de ${site.pricing.deliveryMin}kg ou mais a entrega é gratuita. Também enviamos para todo o Brasil via transportadora.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Quais tamanhos de embalagem estão disponíveis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'As batatas chips artesanais Ahara estão disponíveis em 50g (porção individual — 20 unidades por kg), 150g (porção média — cerca de 6,6 unidades por kg) e 500g (food service — 2 unidades por kg).',
        },
      },
      {
        '@type': 'Question',
        name: 'A Ahara oferece desconto por volume?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sim. Tabela de desconto progressivo: ${site.pricing.discountTiers.map((t) => `${t.discountPercent}% a partir de ${t.kg}kg`).join(', ')}.`,
        },
      },
      {
        '@type': 'Question',
        name: 'As batatas chips Ahara contêm glúten?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Não. As batatas chips artesanais Ahara são isentas de glúten. O produto contém derivados de soja (gordura vegetal).',
        },
      },
    ],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// INTENT ENTITIES — desambiguação semântica do cluster atacado/revenda/revender
// Cada intenção é uma entidade própria (DefinedTerm) num glossário do site.
// Resolve canibalização: os spokes deixam de apontar todos `about → Organization`
// e passam a declarar `about` da SUA intenção específica + o Produto.
// ──────────────────────────────────────────────────────────────────────────────

const GLOSSARY_ID = `${BASE}/#glossario-atacado-revenda`;

export type IntentTopic = 'atacado' | 'revenda' | 'revender';

const INTENT_DEFS: Record<IntentTopic, { name: string; description: string }> = {
  atacado: {
    name: 'Atacado de batata chips',
    description:
      'Compra de batata chips artesanal no atacado, por quilo (a granel), com pedido mínimo de 5kg e desconto progressivo por volume — destinada a lojistas, comércios, eventos e food service que querem preço de atacado direto da fábrica.',
  },
  revenda: {
    name: 'Revenda de batata chips',
    description:
      'Modelo de revenda de batata chips artesanal com foco em margem e lucro do revendedor — quem compra para revender em cantinas, bares, portarias, eventos e comércio de bairro, ganhando na quantidade vendida.',
  },
  revender: {
    name: 'Como revender batata chips',
    description:
      'Processo e primeiros passos para começar a revender batata chips artesanal — do pedido mínimo à precificação e à logística, para o revendedor iniciante que quer entrar no ramo.',
  },
};

/** Normaliza o tópico bruto do slug para uma das 3 intenções canônicas (ou null). */
export function normalizeIntent(rawTopic: string | null): IntentTopic | null {
  if (!rawTopic) return null;
  if (rawTopic === 'atacado') return 'atacado';
  if (rawTopic === 'revender') return 'revender';
  if (rawTopic === 'revenda' || rawTopic === 'para-revenda') return 'revenda';
  return null;
}

/** Nó DefinedTerm da intenção — incluído no @graph do post para o @id resolver. */
export function intentEntityNode(topic: IntentTopic) {
  const def = INTENT_DEFS[topic];
  return {
    '@type': 'DefinedTerm',
    '@id': `${BASE}/#intent-${topic}`,
    name: def.name,
    description: def.description,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': GLOSSARY_ID,
      name: 'Glossário de atacado e revenda de batata chips — Ahara',
    },
  };
}

/**
 * Monta `about` + `mentions` de um BlogPosting conforme a intenção do slug.
 * - COM intenção: about = [entidade da intenção, Produto]; mentions = Organization.
 * - SEM intenção: about = Produto; mentions = Organization (fallback seguro).
 * Retorna também o nó da intenção para incluir no @graph (ou null).
 */
export function articleSemanticLinks(topic: IntentTopic | null) {
  if (topic) {
    return {
      about: [{ '@id': `${BASE}/#intent-${topic}` }, { '@id': PRODUCT_ID }],
      mentions: [{ '@id': ORG_ID }],
      extraNode: intentEntityNode(topic),
    };
  }
  return {
    about: [{ '@id': PRODUCT_ID }],
    mentions: [{ '@id': ORG_ID }],
    extraNode: null as Record<string, unknown> | null,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// ENTITY STUBS — nós mínimos de Produto e Marca para o @graph dos POSTS
//
// `articleSemanticLinks()` referencia PRODUCT_ID em `about` de todo BlogPosting e
// o stub do Produto referencia BRAND_ID. Ambos os nós completos só são construídos
// em /produtos/ (e a Marca também na home), então nas 89 páginas de post os dois
// @id não resolviam. Estes stubs existem unicamente para o @id resolver.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Produto MÍNIMO — só identidade, sem oferta.
 *
 * Deliberadamente SEM offers / price / AggregateOffer / nutrition / hasVariant:
 * a documentação do Google restringe o rich result de produto a páginas focadas
 * em um único produto. Replicar a oferta em 89 artigos seria pleitear
 * elegibilidade indevida. O Product completo continua só em /produtos/.
 * https://developers.google.com/search/docs/appearance/structured-data/product
 */
export function productStubNode() {
  return {
    '@type': 'Product',
    '@id': PRODUCT_ID,
    name: 'Niko Batata Chips Artesanal — Sabor Tradicional',
    description: 'Batata chips artesanal sabor tradicional produzida pela Ahara em Brasília/DF.',
    url: `${BASE}/produtos/`,
    brand: { '@id': BRAND_ID },
  };
}

/**
 * Par de stubs (Produto mínimo + Marca mínima) para inclusão no @graph dos posts.
 * A Marca reaproveita `brandNikoNode()` — que já é mínimo (name/description/url/
 * logo, sem oferta) — para não criar uma segunda definição concorrente do mesmo
 * @id. O `logo` dele aponta para LOGO_ID, que `buildGraph` emite em toda página.
 */
export function articleEntityStubs(): Record<string, unknown>[] {
  return [productStubNode(), brandNikoNode()];
}

// ──────────────────────────────────────────────────────────────────────────────
// SILOS — arquitetura de cluster temático (hub/pillar ↔ spokes) para fluxo de
// autoridade vertical. Cada silo tem um pillar (página-hub) que lista seus spokes
// e recebe a autoridade deles via breadcrumb + isPartOf.
// ──────────────────────────────────────────────────────────────────────────────

export interface SiloDef {
  key: string;
  name: string;
  pillarSlug: string | null; // slug do post-pillar do silo (null = sem pillar ainda)
  match: RegExp; // casa o slug do spoke ao silo
}

/**
 * Silo de último recurso. `match` é um negative lookahead vazio — nunca casa nada,
 * então `SILOS.find()` jamais o devolve: ele só chega ao slug pelo fallback
 * explícito de `siloOf()`.
 */
const GERAL_SILO: SiloDef = {
  key: 'geral',
  name: 'Geral',
  pillarSlug: null,
  match: /(?!)/,
};

/**
 * A ORDEM É SIGNIFICATIVA: `siloOf()` devolve o PRIMEIRO match.
 *
 * Os silos de vocabulário específico vêm todos ANTES de 'atacado-revenda', porque
 * os tokens dele (atacado | revenda | revender) aparecem também em slugs de food
 * service, festa, marca própria e atributo de produto — se viesse primeiro, ele
 * engoliria todos eles. Exemplos reais do repositório:
 *   batata-chips-para-festa-atacado        → eventos-festas, não atacado
 *   batata-chips-sem-gluten-atacado        → produto-qualidade, não atacado
 *   batata-chips-atlantic-revenda          → produto-qualidade, não atacado
 *   fabrica-de-snack-para-marca-propria    → marca-propria, não fabrica-fabricante
 *   fabricar-batata-chips-com-minha-marca  → marca-propria, não fabrica-fabricante
 *   mini-batata-chips-personalizada-festa  → personalizado-brindes, não eventos
 *   brinde-personalizado-comestivel-evento → personalizado-brindes, não eventos
 *
 * Os tokens 'frita' e 'granel' foram REMOVIDOS de atacado-revenda: capturavam por
 * engano os comparativos de cardápio (batata-chips-x-batata-frita-margem-
 * hamburgueria, batata-chips-acompanhamento-alternativo-batata-frita-cardapio) e o
 * post de granel para restaurante (comprar-batata-chips-a-granel-para-restaurante),
 * que são food service. Nenhum slug de atacado depende deles — batata-frita-chips-
 * atacado e saco-de-batata-chips-atacado casam por 'atacado'.
 * 'distribuidora' também saiu: passou a ser vocabulário do silo 'distribuicao'.
 */
export const SILOS: SiloDef[] = [
  {
    key: 'food-service',
    name: 'Food Service',
    pillarSlug: 'fornecedor-batata-chips-artesanal-hamburgueria',
    match: /(hamburgueria|hamburguer|restaurante|cardapio|food-service|delivery|cmv|acompanhamento|gourmet)/,
  },
  {
    key: 'personalizado-brindes',
    name: 'Personalizado e Brindes',
    pillarSlug: 'batata-chips-com-rotulo-personalizado',
    match: /(personalizad|rotulo|brinde|lembranc|casamento|padrinho)/,
  },
  {
    key: 'marca-propria',
    name: 'Marca Própria',
    pillarSlug: 'batata-chips-marca-propria-private-label',
    match: /(marca-propria|private-label|minha-marca|terceirizacao)/,
  },
  {
    key: 'distribuicao',
    name: 'Distribuição',
    pillarSlug: 'programa-de-distribuidores',
    match: /(distribui|representante)/,
  },
  {
    key: 'fabrica-fabricante',
    name: 'Fábrica e Fabricante',
    pillarSlug: 'fabrica-de-batata-chips-artesanal',
    match: /(fabrica|industria)/,
  },
  {
    key: 'eventos-festas',
    name: 'Eventos e Festas',
    pillarSlug: 'fornecedor-de-snacks-para-eventos',
    match: /(festa|evento|formatura|junina|copa|buffet|aniversario)/,
  },
  {
    key: 'produto-qualidade',
    name: 'Produto e Qualidade',
    pillarSlug: 'batata-chips-crocante-artesanal-kg',
    match: /(marquise|atlantic|variedade|crocante|sem-gluten|sabor-sal|tradicional)/,
  },
  // As três intenções comerciais são silos próprios, e não um "Atacado e Revenda"
  // único. O motivo é que o mesmo arquivo já as distingue em normalizeIntent(): um
  // silo só colocava 42 das 89 páginas (47% do site) sob um pillar, misturando quem
  // quer comprar volume, quem quer margem de revenda e quem quer começar a revender.
  // Os três matches são disjuntos por construção: 'revender' não contém 'revenda'
  // nem vice-versa, e nenhum slug atual carrega 'atacado' junto com os outros dois.
  // Tokens de formato e atributo ('saco', '10kg', 'caseira') saíram do match: nenhum
  // slug depende deles, e mantê-los faria um slug futuro cair aqui em silêncio, sem
  // disparar o aviso do silo 'geral'. Mesmo motivo que tirou 'frita' e 'granel'.
  {
    key: 'atacado',
    name: 'Atacado',
    pillarSlug: 'comprar-batata-chips-atacado',
    match: /atacado/,
  },
  {
    key: 'revenda',
    name: 'Revenda',
    pillarSlug: 'batata-chips-para-revenda',
    match: /(revenda|onde-comprar)/,
  },
  {
    key: 'revender',
    name: 'Como Revender',
    pillarSlug: 'batata-chips-para-revender',
    match: /revender/,
  },
  GERAL_SILO,
];

// siloOf() é chamado O(n^2) durante o build (cada post filtra allPosts), então o
// aviso é deduplicado por slug para não repetir a mesma linha centenas de vezes.
const warnedSlugs = new Set<string>();

/**
 * Resolve o silo de um slug. Sem match, devolve o silo explícito 'geral' e AVISA
 * no build — o fallback silencioso anterior (`?? SILOS[0]`) escondia slug novo
 * dentro de 'atacado-revenda' sem que ninguém percebesse.
 */
export function siloOf(slug: string): SiloDef {
  const hit = SILOS.find((s) => s.match.test(slug));
  if (hit) return hit;
  if (!warnedSlugs.has(slug)) {
    warnedSlugs.add(slug);
    console.warn(
      `[schema/SILOS] slug sem silo: "${slug}" -> caiu em 'geral'. ` +
        `Acrescente um token ao match do silo correto em src/lib/schema.ts.`,
    );
  }
  return GERAL_SILO;
}

/** True se o slug é o pillar (hub) do seu silo. */
export function isPillar(slug: string): boolean {
  return SILOS.some((s) => s.pillarSlug === slug);
}

/** ItemList do silo — incluído no @graph do pillar para listar seus spokes. */
export function siloItemListNode(
  pillarUrl: string,
  items: { url: string; name: string }[],
) {
  return {
    '@type': 'ItemList',
    '@id': `${pillarUrl}#silo-itemlist`,
    name: 'Páginas deste tópico',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: it.url,
      name: it.name,
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// GRAPH ASSEMBLER
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Percorre o @graph e separa os @id DEFINIDOS dos apenas REFERENCIADOS.
 * Convenção usada em todo este arquivo: um objeto cuja ÚNICA chave é '@id' é uma
 * referência; um objeto com '@id' + outras chaves é uma definição.
 */
function scanGraphIds(value: unknown, defined: Set<string>, referenced: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) scanGraphIds(item, defined, referenced);
    return;
  }
  if (value === null || typeof value !== 'object') return;

  const obj = value as Record<string, unknown>;
  const id = obj['@id'];
  if (typeof id === 'string') {
    if (Object.keys(obj).length === 1) referenced.add(id);
    else defined.add(id);
  }
  for (const child of Object.values(obj)) scanGraphIds(child, defined, referenced);
}

/**
 * Monta o @graph final. As páginas passam apenas os nodes específicos delas;
 * Organization + Logo + WebSite são sempre incluídos (sitewide).
 *
 * Antes de fechar, resolve referências penduradas: um @id citado nesta página mas
 * nunca definido nela. É o caso do Produto e da Marca nos 89 posts — o `about` do
 * BlogPosting aponta para eles, mas os nós só existiam em /produtos/. Em /produtos/
 * e na home nada é acrescentado, porque lá os nós já estão definidos.
 *
 * A ordem importa: o stub do Produto referencia a Marca, então ele entra primeiro
 * e o passe seguinte já enxerga a referência nova.
 */
export function buildGraph(extraNodes: Record<string, unknown>[] = []) {
  const nodes: Record<string, unknown>[] = [
    organizationNode(),
    logoNode(),
    websiteNode(),
    ...extraNodes,
  ];

  for (const stub of articleEntityStubs()) {
    const defined = new Set<string>();
    const referenced = new Set<string>();
    scanGraphIds(nodes, defined, referenced);

    const id = stub['@id'] as string;
    if (referenced.has(id) && !defined.has(id)) nodes.push(stub);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
