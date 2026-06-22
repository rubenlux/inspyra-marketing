import { BusinessContextEngine } from "./src/business-context-engine/business-context-engine.service.js";

/**
 * VALIDACIÓN FUNCIONAL REAL
 * Ejecuta Business Context Engine sobre signals REALES extraídas de EVIDENCIA_REAL_PIPELINE.md
 * (no datos sintéticos de test-data.ts)
 */

const engine = new BusinessContextEngine();

// ============================================================================
// CASO 1: CASA VIGIL - Signals REALES de EVIDENCIA_REAL_PIPELINE.md
// ============================================================================
const CASA_VIGIL_REAL = {
  id: "casa-vigil-real",
  nombreEmpresa: "Casa Vigil",
  rubro: "Restaurante de alta cocina",
  website: "universovigil.com",
  signals: {
    title: "UNIVERSO VIGIL",
    hasGA4: true,
    hasGTM: true,
    h1Count: 0,
    httpsOk: true,
    hasPhone: false,
    hasReact: false,
    hasHotjar: false,
    hasMautic: false,
    hasNextJs: false,
    hasOgTags: false,
    hasSchema: false,
    noWebsite: false,
    accessible: true,
    fetchError: null,
    hasAddress: false,
    hasHubSpot: false,
    hasShopify: false,
    hasSitemap: false,
    imageCount: 2,
    technology: ["GTM"],
    hasLeadForm: false,
    hasViewport: true,
    schemaTypes: [],
    hasAnalytics: true,
    hasCanonical: false,
    hasEcommerce: true,
    hasElementor: false,
    hasMetaPixel: false,
    hasWordPress: false,
    robotsBlocked: false,
    hasContactForm: false,
    hasSocialLinks: true,
    hasSocialLinksFound: ["instagram.com", "facebook.com", "twitter.com"],
    hasWooCommerce: false,
    mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"],
    hasOnlineBooking: false,
    hasGoogleBusiness: false,
    hasMetaDescription: true,
    hasMicrosoftClarity: false,
    estimatedPageWeightKb: 10
  }
};

// ============================================================================
// CASO 2: BODEGAS LOPEZ - Signals NULL (no disponibles)
// ============================================================================
const BODEGAS_LOPEZ_REAL = {
  id: "bodegas-lopez-real",
  nombreEmpresa: "Bodegas López",
  rubro: "Bodega",
  website: "bodegaslopez.com.ar",
  signals: null
};

// ============================================================================
// CASO 3: NORTON - Signals REALES
// ============================================================================
const NORTON_REAL = {
  id: "norton-real",
  nombreEmpresa: "Bodega Norton",
  rubro: "Bodega",
  website: "norton.com.ar",
  signals: {
    title: "Bodega Norton - Norton",
    hasGA4: true,
    hasGTM: true,
    h1Count: 2,
    httpsOk: true,
    hasPhone: false,
    hasReact: false,
    hasHotjar: false,
    hasMautic: false,
    hasNextJs: false,
    hasOgTags: true,
    hasSchema: false,
    noWebsite: false,
    accessible: true,
    fetchError: null,
    hasAddress: false,
    hasHubSpot: false,
    hasShopify: false,
    hasSitemap: false,
    imageCount: 14,
    technology: ["WordPress", "WooCommerce", "GTM"],
    hasLeadForm: false,
    hasViewport: true,
    schemaTypes: [],
    hasAnalytics: true,
    hasCanonical: true,
    hasEcommerce: true,
    hasElementor: false,
    hasMetaPixel: false,
    hasWordPress: true,
    robotsBlocked: false,
    hasContactForm: true,
    hasSocialLinks: true,
    hasSocialLinksFound: ["instagram.com", "facebook.com", "twitter.com", "youtube.com"],
    hasWooCommerce: true,
    mainNavSections: ["NOSOTROS", "NUESTROS VINOS", "SPIRITS & IMPORTADOS"],
    hasOnlineBooking: false,
    hasGoogleBusiness: false,
    hasMetaDescription: false,
    hasMicrosoftClarity: false,
    estimatedPageWeightKb: 372
  }
};

// ============================================================================
// CASO 4: PULENTA ESTATE - Signals REALES
// ============================================================================
const PULENTA_ESTATE_REAL = {
  id: "pulenta-estate-real",
  nombreEmpresa: "Pulenta Estate",
  rubro: "Bodega",
  website: "pulentaestate.com",
  signals: {
    title: "Pulenta Estate | Mendoza - Argentina",
    hasGA4: true,
    hasGTM: true,
    h1Count: 2,
    httpsOk: true,
    hasPhone: true,
    hasReact: false,
    hasHotjar: false,
    hasMautic: false,
    hasNextJs: false,
    hasOgTags: true,
    hasSchema: false,
    noWebsite: false,
    accessible: true,
    fetchError: null,
    hasAddress: false,
    hasHubSpot: false,
    hasShopify: false,
    hasSitemap: false,
    imageCount: 21,
    technology: ["GTM"],
    hasLeadForm: false,
    hasViewport: true,
    schemaTypes: [],
    hasAnalytics: true,
    hasCanonical: false,
    hasEcommerce: true,
    hasElementor: false,
    hasMetaPixel: true,
    hasWordPress: false,
    robotsBlocked: false,
    hasContactForm: true,
    hasSocialLinks: true,
    hasSocialLinksFound: ["instagram.com", "facebook.com", "twitter.com"],
    hasWooCommerce: false,
    mainNavSections: ["ESP", "ENG", "POR", "TIENDA", "VINOS", "TURISMO", "QUIÉNES SOMOS", "VIÑEDOS", "SUSTENTABILIDAD", "LA FLOR"],
    hasOnlineBooking: true,
    hasGoogleBusiness: false,
    hasMetaDescription: false,
    hasMicrosoftClarity: false,
    estimatedPageWeightKb: 25
  }
};

const testCases = [
  {
    name: "Casa Vigil",
    data: CASA_VIGIL_REAL,
    expectedOportunities: [
      "Sistema de Reservas Online",
      "Automatización / CRM",
      "SEO Técnico",
      "UX/UI y CRO"
    ]
  },
  {
    name: "Bodegas López",
    data: BODEGAS_LOPEZ_REAL,
    expectedOportunities: [
      "Ecommerce (tienda online)",
      "SEO Técnico",
      "Performance Web"
    ]
  },
  {
    name: "Norton",
    data: NORTON_REAL,
    expectedOportunities: [
      "Sistema de Reservas Online",
      "Automatización / CRM",
      "SEO Técnico"
    ]
  },
  {
    name: "Pulenta Estate",
    data: PULENTA_ESTATE_REAL,
    expectedOportunities: [
      "SEO Local / GBP",
      "Community Management",
      "SEO de Contenidos"
    ]
  }
];

console.log("═".repeat(80));
console.log("VALIDACIÓN FUNCIONAL REAL - BUSINESS CONTEXT ENGINE");
console.log("Signals extraídas de: EVIDENCIA_REAL_PIPELINE.md");
console.log("═".repeat(80));
console.log("");

testCases.forEach((testCase, index) => {
  console.log(`\n${"─".repeat(80)}`);
  console.log(`CASO ${index + 1}: ${testCase.name}`);
  console.log(`${"─".repeat(80)}\n`);

  try {
    const result = engine.process(testCase.data);

    console.log("📊 CLASIFICACIÓN GENERADA:\n");
    console.log(JSON.stringify(result.businessClassification, null, 2));

    console.log("\n📊 ANÁLISIS DE SITIO:\n");
    if (result.websiteAnalysis) {
      console.log("CAPABILITIES:");
      console.log(JSON.stringify(result.websiteAnalysis.capabilities, null, 2));

      console.log("\nOBSERVED PATTERNS:");
      console.log(JSON.stringify(result.websiteAnalysis.observedPatterns, null, 2));

      console.log("\nCUSTOMER ACQUISITION CHANNELS:");
      console.log(JSON.stringify(result.websiteAnalysis.customerAcquisitionChannels, null, 2));

      console.log("\nBUSINESS MODELS:");
      console.log(JSON.stringify(result.websiteAnalysis.businessModels, null, 2));
    } else {
      console.log("(No website analysis available - no signals)");
    }

    console.log("\n📋 METADATA:\n");
    console.log(JSON.stringify(result.metadata, null, 2));

    console.log("\n\n🔍 AUDITORÍA MANUAL:\n");
    console.log(`✓ Industry: ${result.businessClassification.industry?.value || "NOT DETECTED"}`);
    console.log(`✓ Subindustries: ${result.businessClassification.subindustries.map(s => s.value).join(", ") || "NONE"}`);
    console.log(`✓ Classification Coverage: ${result.metadata.classificationCoverage}`);
    console.log(`✓ Data Integrity: ${result.metadata.dataIntegrity}`);
    console.log(`✓ Signals Available: ${result.metadata.signalsAvailable}`);
    console.log(`✓ Patterns Detected: ${result.websiteAnalysis?.observedPatterns?.length || 0}`);

    if (testCase.expectedOportunities) {
      console.log(`\n⚠️  EXPECTED OPPORTUNITIES (from EVIDENCIA_REAL_PIPELINE.md):`);
      testCase.expectedOportunities.forEach(opp => {
        console.log(`   - ${opp}`);
      });
    }

  } catch (error) {
    console.error(`❌ ERROR:`, error.message);
  }

  console.log("");
});

console.log("\n" + "═".repeat(80));
console.log("FIN VALIDACIÓN");
console.log("═".repeat(80));
