import {
  BusinessContext,
  BusinessClassification,
  WebsiteAnalysis,
  ProspectInput,
  ClassificationWithEvidence,
  PendingClassification,
  IndustryType,
  SubindustryType,
  PatternCode,
  Channel,
  BusinessModel,
  ClassificationCoverage,
  PatternStatus,
} from "./types";

/**
 * BUSINESS CONTEXT ENGINE SERVICE
 *
 * Implementa 6 reglas duras:
 * 1. Wine/Beverages: 3 evidencias (rubro OR nav OR ecommerce)
 * 2. Accommodation: ELIMINADO
 * 3. NO signals = NO analysis
 * 4. source+evidence+confidence en TODO
 * 5. NO INFERENCIA DE NEGOCIO (prohibidas 10 categorías)
 * 6. EXPLICABILIDAD TOTAL (metadata completa)
 */

export class BusinessContextEngine {
  process(input: ProspectInput): BusinessContext {
    const rubro = input.rubro.toLowerCase();

    // ========================================================================
    // PASO 1: CLASIFICACIÓN DE NEGOCIO (SIEMPRE, usando rubro)
    // ========================================================================
    const businessClassification = this.classifyBusiness(rubro);
    const classificationCoverage = this.determineClassificationCoverage(
      businessClassification
    );

    // ========================================================================
    // PASO 2: ANÁLISIS DE SITIO (SOLO si signals disponibles)
    // ========================================================================
    let websiteAnalysis: WebsiteAnalysis | null = null;
    if (input.signals && Object.keys(input.signals).length > 0) {
      const signals = input.signals;
      const navSections = (signals.mainNavSections || []).map((s) =>
        s.toLowerCase()
      );
      websiteAnalysis = this.analyzeWebsite(rubro, navSections, signals);
    }

    // ========================================================================
    // METADATA
    // ========================================================================
    const metadata = {
      classificationValid: businessClassification.industry !== null,
      classificationCoverage,
      signalsAvailable: input.signals !== null && Object.keys(input.signals).length > 0,
      analysisValid: websiteAnalysis !== null,
      dataIntegrity: this.determineDataIntegrity(
        businessClassification,
        websiteAnalysis,
        classificationCoverage
      ),
      notes: this.generateNotes(businessClassification, websiteAnalysis),
    };

    return {
      prospectId: input.id,
      prospectName: input.nombreEmpresa,
      rubro: input.rubro,
      businessClassification,
      websiteAnalysis,
      metadata,
      generatedAt: new Date().toISOString(),
    };
  }

  // ========================================================================
  // STEP 1: BUSINESS CLASSIFICATION (from rubro only)
  // ========================================================================

  private classifyBusiness(rubro: string): BusinessClassification {
    const industry = this.classifyIndustry(rubro);
    const subindustries = this.classifySubindustriesFromRubro(rubro);

    return {
      industry,
      subindustries,
    };
  }

  private classifyIndustry(rubro: string): ClassificationWithEvidence<IndustryType> | null {
    const rubroPatterns: Record<string, IndustryType> = {
      restaurante: "Food & Beverage",
      bodega: "Food & Beverage",
      café: "Food & Beverage",
      coffee: "Food & Beverage",
      panadería: "Food & Beverage",
      bakery: "Food & Beverage",
      hotel: "Tourism & Hospitality",
      hostel: "Tourism & Hospitality",
      hospedaje: "Tourism & Hospitality",
      alojamiento: "Tourism & Hospitality",
      tienda: "Retail",
      shop: "Retail",
      comercio: "Retail",
      retail: "Retail",
      boutique: "Retail",
      spa: "Health & Wellness",
      fitness: "Health & Wellness",
      gym: "Health & Wellness",
      consultora: "Professional Services",
      consulting: "Professional Services",
      abogado: "Professional Services",
      contador: "Professional Services",
      agencia: "Professional Services",
    };

    for (const [pattern, industry] of Object.entries(rubroPatterns)) {
      if (rubro.includes(pattern)) {
        return {
          value: industry,
          source: "rubro",
          evidence: [rubro],
          rule: `rubro CONTAINS "${pattern}"`,
        };
      }
    }

    return null;
  }

  private classifySubindustriesFromRubro(
    rubro: string
  ): Array<ClassificationWithEvidence<SubindustryType> | PendingClassification> {
    const subindustries: Array<
      ClassificationWithEvidence<SubindustryType> | PendingClassification
    > = [];

    // Wine/Beverages (rubro only)
    const wineKeywords = [
      "bodega",
      "viña",
      "vino",
      "viñedo",
      "wine",
      "winery",
    ];
    if (wineKeywords.some((kw) => rubro.includes(kw))) {
      subindustries.push({
        value: "Wine/Beverages",
        source: "rubro",
        evidence: [rubro],
        rule: "rubro CONTAINS bodega|viña|vino|viñedo|wine|winery",
      });
    }

    // Food Service
    if (
      rubro.includes("restaurante") ||
      rubro.includes("comida") ||
      rubro.includes("food")
    ) {
      subindustries.push({
        value: "Food Service",
        source: "rubro",
        evidence: [rubro],
        rule: "rubro CONTAINS restaurante|comida|food",
      });
    }

    // Bakery
    if (rubro.includes("panadería") || rubro.includes("bakery")) {
      subindustries.push({
        value: "Bakery",
        source: "rubro",
        evidence: [rubro],
        rule: "rubro CONTAINS panadería|bakery",
      });
    }

    // Coffee Shop
    if (rubro.includes("café") || rubro.includes("coffee")) {
      subindustries.push({
        value: "Coffee Shop",
        source: "rubro",
        evidence: [rubro],
        rule: "rubro CONTAINS café|coffee",
      });
    }

    return subindustries;
  }

  // ========================================================================
  // STEP 2: WEBSITE ANALYSIS (from signals only)
  // ========================================================================

  private analyzeWebsite(
    rubro: string,
    navSections: string[],
    signals: any
  ): WebsiteAnalysis {
    const capabilities = {
      hasOnlineBooking: signals.hasOnlineBooking || null,
      hasEcommerce: signals.hasEcommerce || null,
      hasSocialPresence: signals.hasSocialLinks || null,
      hasLeadCapture:
        signals.hasLeadForm || signals.hasContactForm || null,
      hasPhoneContact: signals.hasPhone || null,
      hasDirectContact: signals.hasContactForm || signals.hasAddress || null,
    };

    const patterns = this.detectPatterns(rubro, navSections, signals);
    const channels = this.classifyChannels(signals);
    const businessModels = this.classifyBusinessModels(signals);

    return {
      capabilities,
      observedPatterns: patterns,
      customerAcquisitionChannels: channels,
      businessModels,
    };
  }



  // ==========================================================================
  // PATTERN DETECTION (con estado: CONFIRMED/UNVERIFIED)
  // ==========================================================================

  private detectPatterns(
    rubro: string,
    navSections: string[],
    signals: any
  ): Array<{
    code: PatternCode;
    description: string;
    signals: string[];
    status: PatternStatus;
    missingEvidence?: string[];
  }> {
    const patterns: Array<{
      code: PatternCode;
      description: string;
      signals: string[];
      status: PatternStatus;
      missingEvidence?: string[];
    }> = [];

    // PATTERN 1: Invitation without mechanism
    const hasReservaNAv = navSections.some(
      (nav) =>
        nav.includes("reserva") ||
        nav.includes("reserve") ||
        nav.includes("booking")
    );
    if (
      hasReservaNAv &&
      !signals.hasOnlineBooking &&
      !signals.hasContactForm &&
      !signals.hasPhone
    ) {
      patterns.push({
        code: "INVITATION_WITHOUT_MECHANISM",
        description:
          "Nav invites to book/reserve but no online booking, contact form, or phone visible",
        signals: [
          "hasOnlineBooking=false",
          "hasContactForm=false",
          "hasPhone=false",
          "nav contains reserva|reserve|booking",
        ],
        status: "UNVERIFIED",
        missingEvidence: ["LINK_DESTINATION_CRAWL"],
      });
    }

    // PATTERN 2: Ecommerce without retargeting (CONFIRMED)
    if (signals.hasEcommerce && !signals.hasMetaPixel) {
      patterns.push({
        code: "ECOMMERCE_WITHOUT_RETARGET",
        description: "Site has ecommerce but no Meta Pixel for retargeting",
        signals: ["hasEcommerce=true", "hasMetaPixel=false"],
        status: "CONFIRMED",
      });
    }

    // PATTERN 3: Social presence but not optimized (CONFIRMED)
    if (signals.hasSocialLinks && !signals.hasLeadForm) {
      patterns.push({
        code: "SOCIAL_NOT_OPTIMIZED",
        description: "Social links present but no lead capture or conversion",
        signals: [
          "hasSocialLinks=true",
          "hasLeadForm=false",
          `socialLinksFound: ${(signals.socialLinksFound || []).join(", ")}`,
        ],
        status: "CONFIRMED",
      });
    }

    // PATTERN 4: Missing contact options (CONFIRMED)
    if (
      !signals.hasPhone &&
      !signals.hasContactForm &&
      !signals.hasAddress &&
      !signals.hasSocialLinks
    ) {
      patterns.push({
        code: "MISSING_CONTACT_OPTIONS",
        description: "No visible way to contact business",
        signals: [
          "hasPhone=false",
          "hasContactForm=false",
          "hasAddress=false",
          "hasSocialLinks=false",
        ],
        status: "CONFIRMED",
      });
    }

    return patterns;
  }

  // ==========================================================================
  // CHANNEL CLASSIFICATION
  // ==========================================================================

  private classifyChannels(
    signals: any
  ): Array<{
    channel: Channel;
    evidence: string;
    signalCode: string;
  }> {
    const channels: Array<{
      channel: Channel;
      evidence: string;
      signalCode: string;
    }> = [];

    if (signals.hasPhone) {
      channels.push({
        channel: "PHONE",
        evidence: "Phone number visible on website",
        signalCode: "hasPhone=true",
      });
    }

    if (signals.hasSocialLinks) {
      channels.push({
        channel: "SOCIAL",
        evidence: `Social links found: ${(signals.socialLinksFound || []).join(", ")}`,
        signalCode: "hasSocialLinks=true",
      });
    }

    if (signals.hasEcommerce) {
      channels.push({
        channel: "ECOMMERCE",
        evidence: "Online store/ecommerce platform detected",
        signalCode: "hasEcommerce=true",
      });
    }

    if (signals.hasContactForm) {
      channels.push({
        channel: "EMAIL",
        evidence: "Contact form available",
        signalCode: "hasContactForm=true",
      });
    }

    if (signals.hasOnlineBooking) {
      channels.push({
        channel: "BOOKING_PLATFORM",
        evidence: "Online booking/reservation system detected",
        signalCode: "hasOnlineBooking=true",
      });
    }

    if (signals.hasAddress) {
      channels.push({
        channel: "DIRECT_CONTACT",
        evidence: "Address visible on website",
        signalCode: "hasAddress=true",
      });
    }

    return channels;
  }

  // ==========================================================================
  // BUSINESS MODEL CLASSIFICATION
  // ==========================================================================

  private classifyBusinessModels(
    signals: any
  ): Array<{
    model: BusinessModel;
    evidence: string;
    signalCode: string;
  }> {
    const models: Array<{
      model: BusinessModel;
      evidence: string;
      signalCode: string;
    }> = [];

    if (signals.hasEcommerce) {
      models.push({
        model: "ECOMMERCE",
        evidence: "Online store detected",
        signalCode: "hasEcommerce=true",
      });
    }

    if (signals.hasOnlineBooking) {
      models.push({
        model: "BOOKING_BASED",
        evidence: "Online booking system detected",
        signalCode: "hasOnlineBooking=true",
      });
    }

    if (signals.hasPhone || signals.hasContactForm) {
      models.push({
        model: "DIRECT_SALES",
        evidence: "Direct contact channels available",
        signalCode:
          "hasPhone=true OR hasContactForm=true",
      });
    }

    return models;
  }

  // ==========================================================================
  // METADATA HELPERS
  // ==========================================================================

  private determineClassificationCoverage(
    classification: BusinessClassification
  ): ClassificationCoverage {
    if (!classification.industry && classification.subindustries.length === 0) {
      return "NONE";
    }
    if (!classification.industry && classification.subindustries.length > 0) {
      return "PARTIAL";
    }
    return "FULL";
  }

  private determineDataIntegrity(
    classification: BusinessClassification,
    analysis: WebsiteAnalysis | null,
    coverage: ClassificationCoverage
  ): "VALID" | "PARTIAL" | "INVALID" {
    // Si no hay análisis de sitio, es PARTIAL (excepto si no hay clasificación)
    if (analysis === null) {
      return coverage === "NONE" ? "INVALID" : "PARTIAL";
    }
    // Si hay análisis pero sin clasificación
    if (coverage === "NONE") {
      return "INVALID";
    }
    // Ambos presentes
    return "VALID";
  }

  // ==========================================================================
  // NOTES GENERATION
  // ==========================================================================

  private generateNotes(
    classification: BusinessClassification,
    analysis: WebsiteAnalysis | null
  ): string[] {
    const notes: string[] = [];

    if (analysis === null) {
      notes.push("Website analysis unavailable - no signals captured");
    } else {
      // Check for UNVERIFIED patterns
      const unverifiedPatterns = analysis.observedPatterns.filter(
        (p) => p.status === "UNVERIFIED"
      );
      if (unverifiedPatterns.length > 0) {
        notes.push(
          `${unverifiedPatterns.length} pattern(s) require verification via link crawling`
        );
      }
    }

    return notes;
  }
}
