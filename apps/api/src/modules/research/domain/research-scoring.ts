import type { RawCompany } from '../providers/discovery-provider.interface';

export class ResearchScoring {
  static scoreToNivel(score: number): 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
    if (score >= 90) return 'CRITICA';
    if (score >= 75) return 'ALTA';
    if (score >= 60) return 'MEDIA';
    return 'BAJA';
  }

  static scoreToPrioridad(score: number): 'BAJA' | 'MEDIA' | 'ALTA' {
    if (score >= 80) return 'ALTA';
    if (score >= 65) return 'MEDIA';
    return 'BAJA';
  }

  static calculateBVS(company: RawCompany, ticketUsd: number): number {
    // A. Ticket Potential (0-6 pts)
    let ticket = 0;
    if (ticketUsd >= 3000) ticket = 6;
    else if (ticketUsd >= 2500) ticket = 5;
    else if (ticketUsd >= 2000) ticket = 4;
    else if (ticketUsd >= 1500) ticket = 2;
    else if (ticketUsd >= 1000) ticket = 1;

    // B. Company Scale (0-8 pts)
    let billing = 0;
    const fac = (company.facturacionEstimada ?? '').toLowerCase();
    if (fac === 'grande') billing = 4;
    else if (fac === 'mediana') billing = 3;
    else if (fac === 'pequeña' || fac === 'pequena') billing = 1;

    const emp = company.empleadosEstimado ?? 0;
    let employees = 0;
    if (emp >= 10) employees = 4;
    else if (emp >= 7) employees = 3;
    else if (emp >= 5) employees = 2;
    else if (emp >= 3) employees = 1;

    // C. Company Maturity (0-4 pts)
    let maturity = 0;
    const foundedYear = parseInt(company.añosFundacion ?? '0', 10);
    if (foundedYear > 1900) {
      const yearsOld = new Date().getFullYear() - foundedYear;
      if (yearsOld >= 30) maturity = 4;
      else if (yearsOld >= 20) maturity = 3;
      else if (yearsOld >= 10) maturity = 2;
      else if (yearsOld >= 5) maturity = 1;
    }

    // D. Sub-sector Premium (0-2 pts)
    const rubro = (company.rubro ?? '').toLowerCase();
    let premium = 0;
    if (/lujo|premium|corporativo|internacional/.test(rubro)) premium = 2;
    else if (/multiservicio|comercial|empresarial/.test(rubro)) premium = 1;

    return Math.min(20, ticket + billing + employees + maturity + premium);
  }
}
