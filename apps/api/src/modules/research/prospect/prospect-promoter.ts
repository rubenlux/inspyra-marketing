import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { RawCompany } from '../providers/discovery-provider.interface';
import type { SonnetEvaluation } from '../evaluation/sonnet-evaluator';
import { ResearchScoring } from '../domain/research-scoring';
import { deriveMapsProblems } from '../domain/derive-maps-problems';

@Injectable()
export class ProspectPromoter {
  constructor(private readonly prisma: PrismaService) {}

  async promote(
    tenantId: string,
    company: RawCompany,
    evaluation: SonnetEvaluation,
  ) {
    const nivel = ResearchScoring.scoreToNivel(evaluation.score);
    const prioridad = ResearchScoring.scoreToPrioridad(evaluation.score);
    const bvs = ResearchScoring.calculateBVS(company, evaluation.estimatedTicketUsd ?? 0);

    const mapsProblems = deriveMapsProblems(company);
    const allProblems = [...new Set([...mapsProblems, ...(evaluation.problemasDetectados ?? [])])];

    const cd = company.contactData;

    return this.prisma.prospect.create({
      data: {
        tenantId,
        nombreEmpresa: company.nombreEmpresa,
        ciudad:        company.ciudad,
        pais:          company.pais,
        rubro:         company.rubro,
        website:       company.website,
        // Contact data: prefer contactData (HTTP-scraped), fall back to discovery fields
        email:     cd?.emails?.[0]    ?? null,
        telefono:  cd?.phones?.[0]    ?? company.telefono ?? null,
        whatsapp:  cd?.whatsapp?.[0]  ?? null,
        instagram: cd?.instagram?.[0] ?? company.instagram ?? null,
        facebook:  cd?.facebook?.[0]  ?? null,
        linkedin:  cd?.linkedin?.[0]  ?? company.linkedin  ?? null,
        empleadosEstimado:    company.empleadosEstimado,
        oportunidadDetectada: evaluation.oportunidadDetectada,
        problemasEncontrados: allProblems,
        currentProblems:      allProblems,
        nivelOportunidad: nivel,
        servicioSugerido: evaluation.servicioSugerido,
        score:           evaluation.score,
        commercialScore: bvs,
        prioridad,
        fuente:      company.source === 'google_maps' ? 'GOOGLE_MAPS' : 'MANUAL',
        detectadoPor: 'IA',
        estado:      'NUEVO',
      },
    });
  }
}
