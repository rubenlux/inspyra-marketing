import type { QualificationSignals } from '../qualification/qualification-signals';
import type { ContactAcquisitionResult } from '../contact/contact-acquisition.types';

// Shared types and error class for all Discovery providers

export class DiscoveryInfrastructureError extends Error {
  constructor(
    public readonly code: 'API_BUDGET_EXCEEDED' | 'WEBSEARCH_TIMEOUT' | 'MCP_UNAVAILABLE' | 'INVALID_JSON' | 'UNKNOWN',
    message: string,
    public readonly rawOutput?: string,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DiscoveryInfrastructureError';
  }
}

export interface RawCompany {
  nombreEmpresa: string;
  ciudad?: string;
  pais?: string;
  provincia?: string;
  rubro?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  descripcion?: string;
  empleadosEstimado?: number;
  añosFundacion?: string;
  presenciaDigital?: {
    tieneWeb?: boolean | null;
    tieneSeo?: boolean | null;
    tieneRedes?: boolean | null;
    tieneEcommerce?: boolean | null;
    tieneAgendaOnline?: boolean | null;
  };
  facturacionEstimada?: string;
  // Google Maps provider fields
  telefono?: string;
  direccion?: string;
  googleMaps?: string;
  googlePlaceId?: string;
  rating?: number;
  reviewCount?: number;
  source?: 'google_maps' | 'agentic_web_search';
  // Populated by QualificationSignalsDetector (Phase 2b)
  qualificationSignals?: QualificationSignals;
  // Populated by ContactAcquisitionService (Phase 2b)
  contactData?: ContactAcquisitionResult;
}

export interface DiscoveryResult {
  companies: RawCompany[];
  sinEvidencia: number;
}

export interface DiscoveryProvider {
  discover(query: string, limit: number): Promise<DiscoveryResult>;
}
