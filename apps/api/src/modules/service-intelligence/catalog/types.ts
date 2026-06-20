export type SectorType =
  | 'GASTRONOMIA' | 'SALUD' | 'BELLEZA' | 'FITNESS'
  | 'INMOBILIARIA' | 'LEGAL' | 'CONTABLE' | 'EDUCACION'
  | 'RETAIL' | 'TECNOLOGIA' | 'CONSTRUCCION' | 'TURISMO'
  | 'BODEGA' | 'ECOMMERCE' | 'CONSULTORIA' | 'GENERIC';

export type BusinessModel = 'B2B' | 'B2C' | 'UNKNOWN';
export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ProspectContext {
  rubro?: string;
  sector: SectorType;
  businessModel: BusinessModel;
  hasInstagram: boolean;
  hasLinkedIn: boolean;
  hasWebsite: boolean;
  empleadosEstimado?: number;
  pais?: string;
  ciudad?: string;
  problemasEncontrados: string[];
  htmlSignals?: string[];
  headerSignals?: string[];
}

export interface ServiceOpportunity {
  serviceId: string;
  serviceName: string;
  category: string;
  opportunityScore: number;
  signals: string[];
  pitchLine: string;
  estimatedTicketUsd: [number, number];
}

export interface ServiceSignalDef {
  id: string;
  label: string;
  severity: SignalSeverity;
  source: 'context' | 'html' | 'headers';
  condition: (ctx: ProspectContext) => boolean;
}

export interface ServiceDefinition {
  id: string;
  category: string;
  name: string;
  pitch: string;
  sectorFit: SectorType[];
  businessModelFit: BusinessModel[];
  signalDefs: ServiceSignalDef[];
  avgTicketUsd: [number, number];
}
