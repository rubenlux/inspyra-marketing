/**
 * BUSINESS CONTEXT VALIDATOR v3
 *
 * Valida la nueva arquitectura con separación de:
 * - businessClassification (SIEMPRE procesado si hay rubro)
 * - websiteAnalysis (SOLO si signals disponibles)
 *
 * Reglas validadas:
 * 1. Wine/Beverages: 3 evidencias OR
 * 2. Accommodation: ELIMINADO
 * 3. NO signals = websiteAnalysis NULL (pero classification OK)
 * 4. source+evidence+rule en TODO (confidence ELIMINADO)
 * 5. NO inferencias de negocio
 * 6. Explicabilidad total (classificationCoverage validado)
 */
export class BusinessContextValidator {
    validate(context) {
        const errors = [];
        // ========================================================================
        // METADATA: Validar integridad general
        // ========================================================================
        this.validateMetadata(context, errors);
        // ========================================================================
        // BUSINESS CLASSIFICATION: Siempre presente
        // ========================================================================
        this.validateBusinessClassification(context, errors);
        // ========================================================================
        // WEBSITE ANALYSIS: Solo si signals disponibles
        // ========================================================================
        if (context.websiteAnalysis) {
            this.validateWebsiteAnalysis(context, errors);
        }
        else {
            // Si NO hay websiteAnalysis, validar que al menos classification existe
            if (!context.businessClassification.industry &&
                context.businessClassification.subindustries.length === 0) {
                errors.push({
                    field: "businessClassification",
                    error: "Neither classification nor website analysis available",
                    severity: "CRITICAL",
                });
            }
        }
        // ========================================================================
        // REGLA 5: NO inferencias de negocio
        // ========================================================================
        this.validateNoBusinessInferences(context, errors);
        // ========================================================================
        // RESULTADO
        // ========================================================================
        const hasCriticalErrors = errors.some((e) => e.severity === "CRITICAL");
        return {
            valid: errors.length === 0 && !hasCriticalErrors,
            errors,
        };
    }
    // ==========================================================================
    // METADATA VALIDATION
    // ==========================================================================
    validateMetadata(context, errors) {
        // Validar que classificationCoverage sea consistente
        const coverage = context.metadata.classificationCoverage;
        if (!["FULL", "PARTIAL", "NONE"].includes(coverage)) {
            errors.push({
                field: "metadata.classificationCoverage",
                error: `Invalid coverage: ${coverage}. Must be FULL|PARTIAL|NONE`,
                severity: "CRITICAL",
            });
        }
        // Si signalsAvailable=false, websiteAnalysis debe ser null y dataIntegrity no VALID
        if (!context.metadata.signalsAvailable) {
            if (context.websiteAnalysis !== null) {
                errors.push({
                    field: "websiteAnalysis",
                    error: "websiteAnalysis must be null when signalsAvailable=false",
                    severity: "CRITICAL",
                });
            }
            if (context.metadata.dataIntegrity === "VALID") {
                errors.push({
                    field: "metadata.dataIntegrity",
                    error: "dataIntegrity cannot be VALID when signalsAvailable=false",
                    severity: "CRITICAL",
                });
            }
        }
        // Si classificationValid=false, coverage debe ser NONE
        if (!context.metadata.classificationValid && coverage !== "NONE") {
            errors.push({
                field: "metadata.classificationCoverage",
                error: `classificationValid=false but coverage=${coverage}. Should be NONE`,
                severity: "CRITICAL",
            });
        }
    }
    // ==========================================================================
    // BUSINESS CLASSIFICATION VALIDATION
    // ==========================================================================
    validateBusinessClassification(context, errors) {
        const { industry, subindustries } = context.businessClassification;
        // REGLA 2: Accommodation ELIMINADO
        const hasAccommodation = subindustries.some((s) => "value" in s && s.value === "Accommodation");
        if (hasAccommodation) {
            errors.push({
                field: "businessClassification.subindustries",
                error: "Accommodation found but is permanently removed from this system",
                severity: "CRITICAL",
            });
        }
        // Validar Industry si existe
        if (industry) {
            this.validateClassificationWithEvidence(industry, "businessClassification.industry", errors);
        }
        // Validar cada Subindustry
        for (let i = 0; i < subindustries.length; i++) {
            const sub = subindustries[i];
            if ("source" in sub && sub.source !== null) {
                // Tiene source: validar evidence + rule
                this.validateClassificationWithEvidence(sub, `businessClassification.subindustries[${i}]`, errors);
            }
            else if ("status" in sub && sub.status === "PENDING") {
                // PENDING: validar reason + requiredEvidence
                if (!sub.reason) {
                    errors.push({
                        field: `businessClassification.subindustries[${i}].reason`,
                        error: `${sub.value} is PENDING but missing reason`,
                        severity: "CRITICAL",
                    });
                }
                if (!sub.requiredEvidence || sub.requiredEvidence.length === 0) {
                    errors.push({
                        field: `businessClassification.subindustries[${i}].requiredEvidence`,
                        error: `${sub.value} is PENDING but missing requiredEvidence`,
                        severity: "CRITICAL",
                    });
                }
            }
        }
        // REGLA 1: Wine/Beverages si existe debe tener source (no PENDING)
        const wineClassified = subindustries.find((s) => "value" in s && s.value === "Wine/Beverages" && "source" in s && s.source !== null);
        if (wineClassified && "evidence" in wineClassified) {
            if (!wineClassified.evidence || wineClassified.evidence.length === 0) {
                errors.push({
                    field: "businessClassification.subindustries.Wine/Beverages",
                    error: "Wine/Beverages classified but missing evidence",
                    severity: "CRITICAL",
                });
            }
        }
    }
    // ==========================================================================
    // WEBSITE ANALYSIS VALIDATION
    // ==========================================================================
    validateWebsiteAnalysis(context, errors) {
        const analysis = context.websiteAnalysis;
        // Validar Patterns
        for (let i = 0; i < analysis.observedPatterns.length; i++) {
            const pattern = analysis.observedPatterns[i];
            // Validar que tenga status (CONFIRMED/UNVERIFIED)
            if (!["CONFIRMED", "UNVERIFIED", "REJECTED"].includes(pattern.status)) {
                errors.push({
                    field: `websiteAnalysis.observedPatterns[${i}].status`,
                    error: `Invalid status: ${pattern.status}. Must be CONFIRMED|UNVERIFIED|REJECTED`,
                    severity: "CRITICAL",
                });
            }
            // Si UNVERIFIED, debe tener missingEvidence
            if (pattern.status === "UNVERIFIED" && (!pattern.missingEvidence || pattern.missingEvidence.length === 0)) {
                errors.push({
                    field: `websiteAnalysis.observedPatterns[${i}].missingEvidence`,
                    error: `Pattern ${pattern.code} is UNVERIFIED but missing missingEvidence list`,
                    severity: "WARNING",
                });
            }
            // Validar signals
            if (!pattern.signals || pattern.signals.length === 0) {
                errors.push({
                    field: `websiteAnalysis.observedPatterns[${i}].signals`,
                    error: `Pattern ${pattern.code} missing signals evidence`,
                    severity: "WARNING",
                });
            }
        }
        // Validar Channels
        for (let i = 0; i < analysis.customerAcquisitionChannels.length; i++) {
            const channel = analysis.customerAcquisitionChannels[i];
            if (!channel.signalCode) {
                errors.push({
                    field: `websiteAnalysis.customerAcquisitionChannels[${i}].signalCode`,
                    error: `Channel ${channel.channel} missing signalCode`,
                    severity: "CRITICAL",
                });
            }
        }
        // Validar Business Models
        for (let i = 0; i < analysis.businessModels.length; i++) {
            const model = analysis.businessModels[i];
            if (!model.signalCode) {
                errors.push({
                    field: `websiteAnalysis.businessModels[${i}].signalCode`,
                    error: `Model ${model.model} missing signalCode`,
                    severity: "CRITICAL",
                });
            }
        }
        // Validar Capabilities
        for (const [key, value] of Object.entries(analysis.capabilities)) {
            if (value === undefined) {
                errors.push({
                    field: `websiteAnalysis.capabilities.${key}`,
                    error: `Capability ${key} is undefined (should be boolean or null)`,
                    severity: "WARNING",
                });
            }
        }
    }
    // ==========================================================================
    // HELPERS
    // ==========================================================================
    validateClassificationWithEvidence(classification, fieldPath, errors) {
        // Validar evidence
        if (!classification.evidence || classification.evidence.length === 0) {
            errors.push({
                field: `${fieldPath}.evidence`,
                error: `${classification.value} has source but missing evidence`,
                severity: "CRITICAL",
            });
        }
        // Validar rule
        if (!classification.rule) {
            errors.push({
                field: `${fieldPath}.rule`,
                error: `${classification.value} has source but missing rule`,
                severity: "CRITICAL",
            });
        }
        // Validar que NO tenga confidence (fue eliminado)
        if ("confidence" in classification) {
            errors.push({
                field: `${fieldPath}.confidence`,
                error: "confidence field should not exist (eliminated in v3)",
                severity: "WARNING",
            });
        }
    }
    validateNoBusinessInferences(context, errors) {
        const prohibitedInferences = [
            "company size",
            "revenue",
            "premium",
            "luxury",
            "market segment",
            "ticket price",
            "customer count",
            "business value",
            "sophistication",
        ];
        const contextJson = JSON.stringify(context).toLowerCase();
        for (const inference of prohibitedInferences) {
            if (contextJson.includes(inference.toLowerCase())) {
                // Buscar en clasificaciones (error crítico)
                const inClassification = context.businessClassification.subindustries.some((s) => "value" in s && s.value.toLowerCase().includes(inference));
                if (inClassification) {
                    errors.push({
                        field: "businessClassification",
                        error: `Prohibited business inference detected: ${inference}`,
                        severity: "CRITICAL",
                    });
                }
            }
        }
    }
    /**
     * Valida que NO haya contradicciones en patterns
     */
    validateNoContradictions(context) {
        const errors = [];
        if (!context.websiteAnalysis) {
            return { valid: true, errors };
        }
        const patterns = context.websiteAnalysis.observedPatterns;
        // Buscar contradicciones: HAS_X y MISSING_X simultáneamente
        for (let i = 0; i < patterns.length; i++) {
            for (let j = i + 1; j < patterns.length; j++) {
                const p1 = patterns[i];
                const p2 = patterns[j];
                // Ejemplo: HAS_SOCIAL + MISSING_CONTACT_OPTIONS sin SOCIAL
                if (p1.code === "SOCIAL_NOT_OPTIMIZED" &&
                    p2.code === "MISSING_CONTACT_OPTIONS") {
                    const hasSocial = p1.signals.some((s) => s.includes("hasSocialLinks=true"));
                    const missingAll = p2.signals.some((s) => s.includes("hasSocialLinks=false"));
                    if (hasSocial && missingAll) {
                        errors.push({
                            field: "observedPatterns",
                            error: `Contradiction: HAS_SOCIAL (pattern ${p1.code}) vs MISSING_SOCIAL (pattern ${p2.code})`,
                            severity: "CRITICAL",
                        });
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
