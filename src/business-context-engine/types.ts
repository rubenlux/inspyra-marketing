/**
 * BUSINESS CONTEXT ENGINE TYPES
 * Reglas duras incorporadas:
 * - Regla 1: Wine/Beverages (3 evidencias)
 * - Regla 2: Accommodation (eliminado)
 * - Regla 3: NO signals = NO analysis
 * - Regla 4: source+evidence+confidence
 * - Regla 5: NO INFERENCIA DE NEGOCIO
 * - Regla 6: EXPLICABILIDAD TOTAL
 */

export type DataIntegrityStatus = "VALID" | "PARTIAL" | "INVALID";
export type ConfidenceLevel = 100 | 80 | 60;
export type EvidenceSource = "rubro" | "mainNavSections" | "ecommerce" | "signals" | "contactData" | "pending";

// ============================================================================
// INPUTS
// ============================================================================

export interface AuditSignals {
  title?: string;
  accessible?: boolean;
  httpsOk?: boolean;
  hasPhone?: boolean;
  hasAddress?: boolean;
  hasContactForm?: boolean;
  hasLeadForm?: boolean;
  hasOnlineBooking?: boolean;
  hasSocialLinks?: boolean;
  socialLinksFound?: string[];
  hasEcommerce?: boolean;
  hasMetaPixel?: boolean;
  hasAnalytics?: boolean;
  hasGA4?: boolean;
  hasGTM?: boolean;
  h1Count?: number;
  hasSchema?: boolean;
  hasSitemap?: boolean;
  hasCanonical?: boolean;
  hasOgTags?: boolean;
  hasMetaDescription?: boolean;
  estimatedPageWeightKb?: number;
  imageCount?: number;
  mainNavSections?: string[];
}

export interface ProspectInput {
  id: string;
  nombreEmpresa: string;
  rubro: string;
  website: string;
  signals: AuditSignals | null;
}

// ============================================================================
// CLASSIFICATIONS (Con explicabilidad total)
// ============================================================================

export interface ClassificationWithEvidence<T> {
  value: T;
  source: EvidenceSource;
  evidence: string[];
  rule: string;
  // confidence eliminado — reglas determinísticas no tienen "confianza"
}

export interface PendingClassification {
  value: string;
  source: null;
  status: "PENDING";
  reason: string;
  requiredEvidence: string[];
}

// Industry types
export type IndustryType =
  | "Food & Beverage"
  | "Retail"
  | "Services"
  | "Tourism & Hospitality"
  | "Professional Services"
  | "Technology"
  | "Health & Wellness"
  | "Education"
  | "Real Estate"
  | "Finance"
  | "Entertainment"
  | "Manufacturing"
  | "Agriculture"
  | "Transportation"
  | "Other";

// Subindustry types
export type SubindustryType =
  | "Wine/Beverages"
  | "Food Service"
  | "Bakery"
  | "Coffee Shop"
  | "Tourism/Experiences"
  | "Accommodation"
  | "Travel Planning"
  | "Retail Commerce"
  | "Fashion/Apparel"
  | "Home & Garden"
  | "Sports & Outdoors"
  | "Beauty & Personal Care"
  | "Consulting"
  | "Accounting"
  | "Legal Services"
  | "Marketing"
  | "Web Development"
  | "Fitness"
  | "Wellness"
  | "Medical"
  | "Dental"
  | "Real Estate Sales"
  | "Real Estate Management";

export type PatternCode =
  | "MULTI_CHANNEL_SALES"
  | "SINGLE_CONTACT_POINT"
  | "INVITATION_WITHOUT_MECHANISM"
  | "ECOMMERCE_WITHOUT_RETARGET"
  | "HIGH_FRICTION_BOOKING"
  | "SOCIAL_NOT_OPTIMIZED"
  | "MISSING_CONTACT_OPTIONS";

export type Channel =
  | "DIRECT_CONTACT"
  | "PHONE"
  | "SOCIAL"
  | "ECOMMERCE"
  | "EMAIL"
  | "WHATSAPP"
  | "BOOKING_PLATFORM";

export type BusinessModel =
  | "DIRECT_SALES"
  | "ECOMMERCE"
  | "BOOKING_BASED"
  | "MEMBERSHIP"
  | "CONSULTING"
  | "SUBSCRIPTION"
  | "MARKETPLACE";

// Classification coverage levels
export type ClassificationCoverage = "FULL" | "PARTIAL" | "NONE";
export type PatternStatus = "CONFIRMED" | "UNVERIFIED" | "REJECTED";

// ============================================================================
// BUSINESS CLASSIFICATION (Fuente: rubro, declarativo)
// ============================================================================

export interface BusinessClassification {
  // Industria principal (clasificación única)
  industry: ClassificationWithEvidence<IndustryType> | null;

  // Subindustrias (múltiples, con trazabilidad)
  subindustries: Array<ClassificationWithEvidence<SubindustryType> | PendingClassification>;
}

// ============================================================================
// WEBSITE ANALYSIS (Fuente: signals, determinístico)
// ============================================================================

export interface WebsiteAnalysis {
  // Capacidades directas de signals (booleanos puros, sin interferencia)
  capabilities: {
    hasOnlineBooking: boolean | null;
    hasEcommerce: boolean | null;
    hasSocialPresence: boolean | null;
    hasLeadCapture: boolean | null;
    hasPhoneContact: boolean | null;
    hasDirectContact: boolean | null;
  };

  // Patrones detectados (con estado de verificación)
  observedPatterns: Array<{
    code: PatternCode;
    description: string;
    signals: string[];
    status: PatternStatus;
    missingEvidence?: string[];
  }>;

  // Canales con trazabilidad
  customerAcquisitionChannels: Array<{
    channel: Channel;
    evidence: string;
    signalCode: string;
  }>;

  // Modelos de negocio con trazabilidad
  businessModels: Array<{
    model: BusinessModel;
    evidence: string;
    signalCode: string;
  }>;
}

// ============================================================================
// OUTPUT STRUCTURE (SEPARADO)
// ============================================================================

export interface BusinessContext {
  // Identificación
  prospectId: string;
  prospectName: string;
  rubro: string;

  // SEPARADO: Clasificación de negocio (siempre procesado si hay rubro)
  businessClassification: BusinessClassification;

  // SEPARADO: Análisis de sitio (solo si signals disponibles)
  websiteAnalysis: WebsiteAnalysis | null;

  // Metadatos críticos (actualizado)
  metadata: {
    // Clasificación de negocio
    classificationValid: boolean;
    classificationCoverage: ClassificationCoverage;

    // Análisis de sitio
    signalsAvailable: boolean;
    analysisValid: boolean;

    // Integridad general
    dataIntegrity: DataIntegrityStatus;

    // Acciones necesarias
    requiredActions?: string[];
    notes?: string[];
  };

  // Generado en timestamp
  generatedAt: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  error: string;
  severity: "CRITICAL" | "WARNING";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
