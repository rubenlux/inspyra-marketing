import type { RawCompany } from '../providers/discovery-provider.interface';

export function deriveMapsProblems(company: RawCompany): string[] {
  if (company.source !== 'google_maps') return [];
  const problems: string[] = [];
  if (!company.website) problems.push('Sin sitio web');
  if ((company.rating ?? 5) < 4.0) problems.push('Calificación baja en Google Maps');
  if ((company.reviewCount ?? 100) < 20) problems.push('Pocas reseñas en Google Maps');
  if (!company.instagram && !company.linkedin) problems.push('Sin presencia en redes sociales detectada');
  return problems;
}
