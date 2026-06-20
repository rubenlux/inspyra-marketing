import type { SectorType, BusinessModel } from './types';

const B2B_SECTORS: SectorType[] = [
  'LEGAL', 'CONTABLE', 'TECNOLOGIA', 'INMOBILIARIA', 'CONSULTORIA', 'CONSTRUCCION',
];

const B2C_SECTORS: SectorType[] = [
  'GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'RETAIL',
  'TURISMO', 'BODEGA', 'ECOMMERCE', 'EDUCACION',
];

const LOCAL_SECTORS: SectorType[] = [
  'GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'INMOBILIARIA',
  'LEGAL', 'CONTABLE', 'CONSTRUCCION', 'TURISMO',
];

const HIGH_REVIEW_SECTORS: SectorType[] = [
  'GASTRONOMIA', 'SALUD', 'BELLEZA', 'TURISMO', 'FITNESS',
];

export function detectSector(rubro?: string): SectorType {
  if (!rubro) return 'GENERIC';
  const r = rubro.toLowerCase();
  if (/restauran|gastro|café|cafe|bar\b|delivery|catering|pizzer|hamburgues|helad|sushi|panade|confiter/.test(r)) return 'GASTRONOMIA';
  if (/dental|odontolog|clínica|clinica|médic|medic|salud|psicolog|veterinar|nutricion|farmac|hospital/.test(r)) return 'SALUD';
  if (/peluquer|estetica|estética|spa|belleza|manicur|pedicur|tatuaj|cosmet|barbería|barberia/.test(r)) return 'BELLEZA';
  if (/gimnasio|gym|fitness|yoga|pilates|personal.?trainer|crossfit|entrena/.test(r)) return 'FITNESS';
  if (/inmobil|real.?estate|propied|bienes.?raíc|bienes.?raic|alquiler|desarrollo.?urban/.test(r)) return 'INMOBILIARIA';
  if (/legal|abogad|estudio.?juríd|estudio.?jurid|notaría|notaria|despacho/.test(r)) return 'LEGAL';
  if (/contad|contable|contador|impuesto|auditor|fiscal|tributar/.test(r)) return 'CONTABLE';
  if (/educa|colegio|instituto|academia|tutoria|coaching|capacita|escuela|universidad/.test(r)) return 'EDUCACION';
  if (/retail|indumentaria|moda|ropa|tienda|comercio|ferretería|ferreteria|jugueter|librería/.test(r)) return 'RETAIL';
  if (/software|tecnolog|startup|saas|it\b|desarrollo.?web|programac|app\b|digital.?agency/.test(r)) return 'TECNOLOGIA';
  if (/construcc|arquitect|reform|obra|contratist|cerrajería|plomería|electricid/.test(r)) return 'CONSTRUCCION';
  if (/hotel|hostel|hosped|turism|agencia.?viaj|airbnb|resort/.test(r)) return 'TURISMO';
  if (/vino|bodega|winer|viñedo|enolog|cava/.test(r)) return 'BODEGA';
  if (/ecommerce|tienda.?online|comercio.?electr/.test(r)) return 'ECOMMERCE';
  if (/consultor|agencia|consulting|advisory|management/.test(r)) return 'CONSULTORIA';
  return 'GENERIC';
}

export function detectBusinessModel(sector: SectorType): BusinessModel {
  if (B2B_SECTORS.includes(sector)) return 'B2B';
  if (B2C_SECTORS.includes(sector)) return 'B2C';
  return 'UNKNOWN';
}

export function isLocalBusiness(sector: SectorType): boolean {
  return LOCAL_SECTORS.includes(sector);
}

export function isHighReviewSector(sector: SectorType): boolean {
  return HIGH_REVIEW_SECTORS.includes(sector);
}
