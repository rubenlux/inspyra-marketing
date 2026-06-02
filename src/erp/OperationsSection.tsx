import type { UiKit } from './DashboardV2'

const PROJECTS = [
  { id: 'P-2417', client: 'Helia Energy', svc: 'Plataforma SaaS', lead: 'Mateo López', status: 'En desarrollo', tone: 'info', due: '12 Jun', pct: 64 },
  { id: 'P-2412', client: 'Tessera Joyas', svc: 'E-commerce Shopify', lead: 'Lucía Romero', status: 'Revisión', tone: 'warning', due: '29 May', pct: 88 },
  { id: 'P-2408', client: 'Calá Inmobiliaria', svc: 'Web institucional', lead: 'Pablo Ferré', status: 'En diseño', tone: 'brand', due: '5 Jun', pct: 32 },
  { id: 'P-2391', client: 'Lumen Salud', svc: 'Landing + Ads', lead: 'Lucía Romero', status: 'Pendiente', tone: 'default', due: '8 Jun', pct: 8 },
]

export function OperationsSection({ ui }: { ui: UiKit }) {
  const { Badge, Icon, KpiCard } = ui

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-title">3 Operaciones</div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 16 }}>
        <KpiCard icon="building" label="Clientes activos" value="48" delta={{ dir: 'up', value: '+3' }} trend={[40, 41, 42, 43, 44, 44, 45, 46, 46, 47, 47, 48]} chartColor="#10B981" />
        <KpiCard icon="flow" label="Proyectos activos" value="23" delta={{ dir: 'flat', value: 'Estable' }} trend={[22, 24, 21, 23, 22, 24, 23, 22, 23, 24, 23, 23]} chartColor="#4B5363" />
        <KpiCard icon="check2" label="Tareas pendientes" value="32" delta={{ dir: 'down', value: '-6' }} trend={[44, 42, 40, 38, 38, 36, 34, 33, 34, 32, 33, 32]} chartColor="#F59E0B" />
        <KpiCard icon="life" label="Tickets abiertos" value="7" delta={{ dir: 'down', value: '-4' }} trend={[14, 12, 11, 12, 10, 9, 9, 8, 8, 7, 7, 7]} chartColor="#EF4444" />
        <KpiCard icon="clock" label="SLA" value="Pendiente" delta={{ dir: 'flat', value: 'Placeholder' }} trend={[10, 10, 11, 10, 12, 12, 12, 13, 13, 13, 14, 14]} chartColor="#9CA3AF" />
        <KpiCard icon="pulse" label="Proyectos en riesgo" value="Placeholder" delta={{ dir: 'flat', value: 'ERP-008 futuro' }} trend={[4, 4, 5, 5, 4, 4, 5, 5, 6, 6, 5, 5]} chartColor="#9CA3AF" />
        <KpiCard icon="layers" label="Carga operativa" value="Placeholder" delta={{ dir: 'flat', value: 'ERP-018 futuro' }} trend={[20, 22, 21, 23, 24, 24, 25, 26, 26, 27, 27, 28]} chartColor="#9CA3AF" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(320px, 1.5fr) minmax(260px, 1fr)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Últimos proyectos</div>
            <button className="btn btn-sm">Ver todos</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="cell-strong">{project.svc}</div>
                    <div className="cell-muted cell-mono" style={{ fontSize: 11.5 }}>{project.id} · {project.pct}%</div>
                  </td>
                  <td className="cell-strong">{project.client}</td>
                  <td><Badge tone={project.tone as 'default' | 'info' | 'warning' | 'brand'} dot>{project.status}</Badge></td>
                  <td className="cell-muted">{project.lead}</td>
                  <td className="cell-muted col-num">{project.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Ejecución</div>
            <Badge tone="outline">Mock UX</Badge>
          </div>
          <div style={{ padding: '4px 6px 6px' }}>
            {[
              { label: 'Deployments activos', value: '124', icon: 'rocket' },
              { label: 'SSL próximos a expirar', value: '3', icon: 'shield' },
              { label: 'Vencimientos próximos', value: '4', icon: 'calendar' },
            ].map((item, index) => {
              const ItemIcon = Icon[item.icon as 'rocket' | 'shield' | 'calendar']
              return (
                <div key={item.label} className="row" style={{ padding: '10px 12px', borderBottom: index === 2 ? 'none' : '1px solid var(--border-soft)', gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-700)' }}>
                    <ItemIcon size={14} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="cell-strong" style={{ fontSize: 13 }}>{item.label}</div>
                    <div className="cell-muted" style={{ fontSize: 11.5 }}>Operación actual</div>
                  </div>
                  <span className="cell-strong col-num">{item.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
