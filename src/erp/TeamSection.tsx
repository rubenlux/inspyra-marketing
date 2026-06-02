import type { UiKit } from './DashboardV2'

const TEAM = [
  { name: 'Mateo López', role: 'Owner', state: 'Online', tasks: 18, tickets: 4 },
  { name: 'Lucía Romero', role: 'Admin · Delivery', state: 'Online', tasks: 24, tickets: 2 },
  { name: 'Pablo Ferré', role: 'Member · Delivery', state: 'Offline', tasks: 15, tickets: 1 },
  { name: 'Camila Vega', role: 'Member · Studio', state: 'Ausente', tasks: 12, tickets: 0 },
]

export function TeamSection({ ui }: { ui: UiKit }) {
  const { Badge, KpiCard, StatusDot } = ui

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-title">4 Equipo</div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 16 }}>
        <KpiCard icon="users" label="Estado del equipo" value="4" unit="online" delta={{ dir: 'flat', value: '2 offline/ausente' }} trend={[4, 4, 5, 5, 5, 4, 4, 4, 5, 4, 4, 4]} chartColor="#5B5BF7" />
        <KpiCard icon="clock" label="Horas registradas" value="286" unit="h" delta={{ dir: 'up', value: '+18h' }} trend={[180, 198, 210, 220, 232, 240, 248, 252, 266, 272, 280, 286]} chartColor="#22D3EE" />
        <KpiCard icon="check2" label="Tareas completadas" value="92" delta={{ dir: 'up', value: '+14' }} trend={[42, 48, 52, 56, 58, 62, 67, 70, 76, 82, 88, 92]} chartColor="#10B981" />
        <KpiCard icon="life" label="Tickets resueltos" value="18" delta={{ dir: 'up', value: '+6' }} trend={[8, 9, 9, 10, 11, 11, 12, 14, 15, 16, 17, 18]} chartColor="#F59E0B" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(320px, 1.35fr) minmax(280px, 1fr)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Estado del equipo</div>
            <div className="row gap-sm">
              <Badge tone="success" dot>Online 2</Badge>
              <Badge tone="outline">Offline 1</Badge>
              <Badge tone="warning" dot>Ausente 1</Badge>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Tareas</th>
                <th>Tickets</th>
              </tr>
            </thead>
            <tbody>
              {TEAM.map((member) => (
                <tr key={member.name}>
                  <td className="cell-strong">{member.name}</td>
                  <td className="cell-muted">{member.role}</td>
                  <td>
                    <span className="row gap-sm">
                      <StatusDot tone={member.state === 'Online' ? 'success' : member.state === 'Ausente' ? 'warning' : 'default'} />
                      {member.state}
                    </span>
                  </td>
                  <td className="col-num">{member.tasks}</td>
                  <td className="col-num">{member.tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Ranking de colaboradores</div>
            <Badge tone="outline">Placeholder ERP-018</Badge>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 14 }}>
            {[
              { label: 'Top productividad', value: 'Pendiente', tone: 'brand' },
              { label: 'Top cumplimiento', value: 'Pendiente', tone: 'success' },
            ].map((item) => (
              <div key={item.label} className="row between" style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
                <span className="row gap-sm">
                  <StatusDot tone={item.tone as 'brand' | 'success'} />
                  <span className="cell-strong">{item.label}</span>
                </span>
                <Badge tone="outline">{item.value}</Badge>
              </div>
            ))}
            <div className="cell-muted" style={{ fontSize: 12 }}>
              Ranking visual preparado; no se calcula score colaborador hasta implementar ERP-018 completo.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
