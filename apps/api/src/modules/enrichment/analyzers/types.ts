// ─── Señales del sitio (Playwright determinístico, 0 tokens) ────────────────
export interface AuditSignals {
  accessible: boolean;
  noWebsite?: boolean;
  httpsOk?: boolean | null;
  title?: string | null;
  hasMetaDescription: boolean;
  h1Count: number;
  hasCanonical: boolean;
  hasSchema: boolean;
  schemaTypes?: string[];
  hasViewport: boolean;
  hasOgTags: boolean;
  hasSitemap: boolean;
  technology?: string[];
  // CMS / Frameworks
  hasWordPress: boolean;
  hasWooCommerce: boolean;
  hasShopify: boolean;
  hasElementor?: boolean;
  hasReact?: boolean;
  hasNextJs?: boolean;
  // Business signals
  hasEcommerce: boolean;
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasLeadForm: boolean;
  // Analytics / Tracking
  hasAnalytics: boolean;
  hasGTM?: boolean;
  hasGA4?: boolean;
  hasMetaPixel: boolean;
  hasHotjar?: boolean;
  hasMicrosoftClarity?: boolean;
  hasHubSpot?: boolean;
  hasMautic?: boolean;
  // Social / Local
  hasSocialLinks: boolean;
  socialLinksFound?: string[];
  hasGoogleBusiness: boolean;
  hasAddress: boolean;
  hasPhone: boolean;
  // Page
  estimatedPageWeightKb?: number | null;
  imageCount?: number | null;
  mainNavSections?: string[];
  robotsBlocked: boolean;
  fetchError?: string | null;
}

// ─── Contexto del prospecto ────────────────────────────────────────────────
export interface ProspectContext {
  nombreEmpresa: string;
  rubro?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  website?: string | null;
  problemasEncontrados?: string[];
  email?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
}

// ─── Resultado de cada analyzer especializado ─────────────────────────────
export type ServiceKey = 'SEO' | 'ECOMMERCE' | 'BOOKING' | 'CRM' | 'CRO' | 'WEB';

export interface AnalyzerResult {
  service: ServiceKey;
  score: number;           // 0-100
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[];
  estimatedValue: number;  // USD
  businessImpact: string;  // orientado al negocio, no técnico
  specificService: string; // nombre exacto del catálogo Inspyra
}

// ─── Output final del Opportunity Engine ─────────────────────────────────
export interface Opportunity {
  service: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  evidence: string[];
  businessImpact: string;
  estimatedValue: number;
}

export interface OpportunityAnalysis {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTicket: number;
  confianza: 'ALTA' | 'MEDIA' | 'BAJA';
  summary: string;
  opportunities: Opportunity[];
}
