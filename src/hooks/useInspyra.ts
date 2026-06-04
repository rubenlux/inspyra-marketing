import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  prospectsApi,
  validationsApi,
  agentRoiApi,
  getStoredToken,
  type ReviewDto,
} from '../api/inspyra'

const authed = () => Boolean(getStoredToken())

export const QK = {
  prospects: (p?: unknown) => ['prospects', p] as const,
  prospectKpis: ['prospects', 'kpis'] as const,
  prospect: (id: string) => ['prospects', id] as const,
  validations: ['validations'] as const,
  validationKpis: ['validations', 'kpis'] as const,
  agentRoi: (period?: string) => ['agent-roi', period] as const,
}

export function useProspects(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: QK.prospects(params),
    queryFn: () => prospectsApi.list(params),
    enabled: authed(),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useProspectKpis() {
  return useQuery({
    queryKey: QK.prospectKpis,
    queryFn: prospectsApi.kpis,
    enabled: authed(),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useProspect(id: string | null | undefined) {
  return useQuery({
    queryKey: QK.prospect(id ?? ''),
    queryFn: () => prospectsApi.get(id!),
    enabled: authed() && Boolean(id),
    staleTime: 30_000,
  })
}

export function useValidations() {
  return useQuery({
    queryKey: QK.validations,
    queryFn: () => validationsApi.list(),
    enabled: authed(),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useValidationKpis() {
  return useQuery({
    queryKey: QK.validationKpis,
    queryFn: validationsApi.kpis,
    enabled: authed(),
    staleTime: 60_000,
  })
}

export function useReviewValidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewDto }) =>
      validationsApi.review(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['validations'] })
      qc.invalidateQueries({ queryKey: ['prospects'] })
    },
  })
}

export function useAgentRoi(period?: string) {
  return useQuery({
    queryKey: QK.agentRoi(period),
    queryFn: () => agentRoiApi.dashboard(period),
    enabled: authed(),
    staleTime: 120_000,
  })
}
