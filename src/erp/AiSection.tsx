import type { UiKit } from './DashboardV2'

const AI_PLACEHOLDERS = [
  { label: 'Agentes ejecutados', icon: 'robot' },
  { label: 'Automatizaciones activas', icon: 'flow' },
  { label: 'Tiempo ahorrado', icon: 'clock' },
  { label: 'Costos IA', icon: 'card' },
  { label: 'Insights IA', icon: 'sparkles' },
  { label: 'Recomendaciones IA', icon: 'target' },
] as const

export function AiSection({ ui }: { ui: UiKit }) {
  const { Badge, Icon } = ui

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-title">6 Inteligencia IA</div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Laboratorio IA</div>
          <Badge tone="outline">Coming Soon</Badge>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {AI_PLACEHOLDERS.map((item) => {
              const ItemIcon = Icon[item.icon]
              return (
                <div key={item.label} className="card" style={{ padding: 16, boxShadow: 'none' }}>
                  <div className="row between" style={{ marginBottom: 12 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ItemIcon size={16} />
                    </span>
                    <Badge tone="outline">Coming Soon</Badge>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                    Placeholder visual hasta implementar ERP-010.
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
