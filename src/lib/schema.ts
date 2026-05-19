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

// ──────────────────────────────────────────────────────────────────────────────
// CORE NODES — Organization + WebSite + Logo (presentes em TODAS as páginas)
// ──────────────────────────────────────────────────────────────────────────────

export function organizationNode() {
  return {
    '@type': ['Organization', 'FoodEstablishment', 'LocalBusiness'],
    '@id': ORG_ID,
    name: site.legalName,
    alternateName: site.name,
    legalName: site.legalName,
    description:
      'Distribuidora B2B de batatas chips artesanais em Brasília/DF. Produção local, atendimento para revendedores, comércios, eventos e food service.',
    url: BASE,
    logo: { '@id': LOGO_ID },
    image: { '@id': LOGO_ID },
    taxID: site.cnpj,
    vatID: site.cnpj,
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
    knowsAbout: [
      'Batatas chips artesanais',
      'Food service',
      'Distribuição B2B',
      'Variedade Marquise',
      'Variedade Atlantic',
      'Boas Práticas de Fabricação',
    ],
    telephone: `+${site.whatsapp.number}`,
    email: site.email,
    priceRange: 'R$ 48 a R$ 55 por kg',
    currenciesAccepted: site.currency,
    paymentAccepted: 'Cash, PIX, Bank Transfer',
    servesCuisine: 'Snacks artesanais',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: 'Brasília',
      addressRegion: 'DF',
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    hasMap: `https://maps.google.com/maps?q=${site.address.mapsQuery}`,
    areaServed: [
      ...site.regions.map((region) => ({ '@type': 'City', name: region })),
      { '@type': 'AdministrativeArea', name: 'Distrito Federal' },
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
        areaServed: 'BR-DF',
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
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: BASE,
    name: site.name,
    description: 'Batatas chips artesanais em Brasília/DF',
    inLanguage: 'pt-BR',
    publisher: { '@id': ORG_ID },
    // SearchAction habilita Sitelinks Search Box quando GSC permitir
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE}/blog/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
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
    itemListElement: site.pricing.discountTiers.map((tier, i) => ({
      '@type': 'Offer',
      '@id': `${catalogId}/tier-${tier.kg}`,
      position: i + 1,
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
      areaServed: site.regions.map((r) => ({ '@type': 'City', name: r })),
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
      '@type': 'City',
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
    areaServed: site.regions.map((r) => ({ '@type': 'City', name: r })),
    audience: {
      '@type': opts.audienceType ?? 'BusinessAudience',
      name: opts.audienceName,
      geographicArea: { '@type': 'AdministrativeArea', name: 'Distrito Federal' },
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: site.whatsapp.url,
      servicePhone: `+${site.whatsapp.number}`,
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
// GRAPH ASSEMBLER
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Monta o @graph final. As páginas passam apenas os nodes específicos delas;
 * Organization + Logo + WebSite são sempre incluídos (sitewide).
 */
export function buildGraph(extraNodes: Record<string, unknown>[] = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationNode(), logoNode(), websiteNode(), ...extraNodes],
  };
}
