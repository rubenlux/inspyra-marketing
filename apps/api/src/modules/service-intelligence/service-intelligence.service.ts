import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface IntelResult {
  problema: string;
  impactoDescripcion: string;
  serviciosRecomendados: string[];
  prioridad: string;
  ticketEstimadoUsd: number;
  bundleSugerido: string | null;
}

@Injectable()
export class ServiceIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(tenantId: string, problemas: string[]): Promise<IntelResult[]> {
    const rules = await this.prisma.serviceIntelligenceRule.findMany({
      where: { tenantId, activo: true },
    });

    const results: IntelResult[] = [];

    for (const problema of problemas) {
      const lower = problema.toLowerCase();

      const matched = rules.filter((rule) =>
        rule.problemPattern
          .split(',')
          .map((p) => p.trim().toLowerCase())
          .some((pattern) => lower.includes(pattern)),
      );

      if (matched.length > 0) {
        // Take the highest-priority matching rule
        const best = matched.sort((a, b) => {
          const order = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };
          return (order[b.prioridad as keyof typeof order] ?? 0) - (order[a.prioridad as keyof typeof order] ?? 0);
        })[0];

        results.push({
          problema,
          impactoDescripcion: best.impactoDescripcion,
          serviciosRecomendados: best.serviciosRecomendados,
          prioridad: best.prioridad,
          ticketEstimadoUsd: Number(best.ticketEstimadoUsd),
          bundleSugerido: best.bundleSugerido,
        });
      } else {
        // No rule matched — return generic entry so agent knows the problem was seen
        results.push({
          problema,
          impactoDescripcion: 'Problema detectado sin regla específica configurada',
          serviciosRecomendados: [],
          prioridad: 'MEDIA',
          ticketEstimadoUsd: 0,
          bundleSugerido: null,
        });
      }
    }

    return results;
  }
}
