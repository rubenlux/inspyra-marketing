import type { UiKit } from './DashboardV2'

export function ExecutiveSection({ ui }: { ui: UiKit }) {
  const { Badge, Icon, KpiCard, StatusDot } = ui

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-title">1 Executive Overview</div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 16 }}>
        <KpiCard
          icon="card"
          label="Facturación Mes"
          value="86,420"
          unit="USD"
          delta={{ dir: 'up', value: '+24%' }}
          trend={[18, 28, 22, 35, 32, 44, 48, 52, 58, 66, 74, 86]}
          chartColor="#5B5BF7"
          chartFill="rgba(91,91,247,.10)"
        />
        <KpiCard
          icon="shield"
          label="Cobranza"
          value="72,040"
          unit="USD"
          delta={{ dir: 'flat', value: '14,580 pendiente' }}
          trend={[30, 34, 40, 38, 44, 49, 52, 58, 62, 65, 68, 72]}
          chartColor="#10B981"
          chartFill="rgba(16,185,129,.10)"
        />
        <KpiCard
          icon="trend"
          label="MRR"
          value="32,180"
          unit="USD/mes"
          delta={{ dir: 'up', value: '+8.2%' }}
          trend={[24, 25, 25, 26, 27, 28, 29, 30, 30, 31, 32, 32]}
          chartColor="#22D3EE"
          chartFill="rgba(34,211,238,.10)"
        />
        <KpiCard
          icon="chart"
          label="Rentabilidad"
          value="Pendiente"
          delta={{ dir: 'flat', value: 'Placeholder' }}
          trend={[20, 20, 21, 21, 22, 22, 22, 23, 23, 23, 24, 24]}
          chartColor="#9CA3AF"
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 1.25fr) minmax(280px, 1fr)', marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Costos IA</div>
            <Badge tone="outline">Placeholder ERP-010</Badge>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            {['OpenAI', 'Claude', 'Gemini'].map((provider) => (
              <div key={provider} className="row between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
                <span className="row gap-sm">
                  <StatusDot tone="default" />
                  <span className="cell-strong">{provider}</span>
                </span>
                <Badge tone="outline">Sin datos todavía</Badge>
              </div>
            ))}
            <div className="cell-muted" style={{ fontSize: 12 }}>
              Los costos reales se habilitan cuando ERP-010 registre ejecuciones y ERP-022 trace herramientas.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Alertas Críticas</div>
            <Badge tone="danger" dot>5 activas</Badge>
          </div>
          <div style={{ padding: '4px 6px 6px' }}>
            {[
              { label: 'Facturas vencidas', value: '2', tone: 'danger' },
              { label: 'Tickets críticos', value: '1', tone: 'danger' },
              { label: 'Integraciones caídas', value: '2', tone: 'warning' },
            ].map((alert, index) => (
              <div key={alert.label} className="row" style={{ padding: '10px 12px', borderBottom: index === 2 ? 'none' : '1px solid var(--border-soft)', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: alert.tone === 'danger' ? 'var(--danger-ink)' : 'var(--warning-ink)' }}>
                  <Icon.pulse size={14} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="cell-strong" style={{ fontSize: 13 }}>{alert.label}</div>
                  <div className="cell-muted" style={{ fontSize: 11.5 }}>Revisión operativa requerida</div>
                </div>
                <Badge tone={alert.tone === 'danger' ? 'danger' : 'warning'}>{alert.value}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
