import type { UiKit } from './DashboardV2'

const PIPELINE = [
  { name: 'Lead', color: '#9CA3AF', deals: [
    { co: 'Aurora Café', contact: 'Sofía Vidal', amt: 'USD 1.4k', days: 'Hoy', svc: 'Web + SEO' },
    { co: 'Nordic Studio', contact: 'K. Lindqvist', amt: 'USD 3.2k', days: '2d', svc: 'Branding + Web' },
    { co: 'Veleta Wines', contact: 'P. Echeverría', amt: 'USD 980', days: '3d', svc: 'Redes' },
    { co: 'Helix Robotics', contact: 'L. Ortega', amt: 'USD 6.4k', days: '5d', svc: 'Software' },
  ] },
  { name: 'Contactado', color: '#A78BFA', deals: [
    { co: 'Bauer & Co', contact: 'J. Bauer', amt: 'USD 5.8k', days: '1d', svc: 'Web · Hosting' },
    { co: 'Lumen Salud', contact: 'Dra. M. Roca', amt: 'USD 2.7k', days: '2d', svc: 'SEO local' },
    { co: 'Forge Legal', contact: 'T. Vega', amt: 'USD 4.5k', days: '4d', svc: 'Web + redes' },
  ] },
  { name: 'Reunión', color: '#5B5BF7', deals: [
    { co: 'Calá Inmobiliaria', contact: 'R. Ferro', amt: 'USD 8.2k', days: 'Mañana', svc: 'Plataforma + SEO' },
    { co: 'Tessera Joyas', contact: 'A. Tessera', amt: 'USD 3.6k', days: 'Hoy', svc: 'Tienda online' },
  ] },
  { name: 'Propuesta', color: '#22D3EE', deals: [
    { co: 'Helia Energy', contact: 'F. Cazenave', amt: 'USD 14.5k', days: 'Vence 3d', svc: 'Software + AWS' },
    { co: 'Norte Films', contact: 'I. Saavedra', amt: 'USD 6.8k', days: 'Vence 5d', svc: 'Plataforma' },
    { co: 'Mira Cosmetics', contact: 'C. Bregman', amt: 'USD 4.2k', days: 'Vence 1d', svc: 'E-commerce' },
  ] },
  { name: 'Ganado', color: '#10B981', deals: [
    { co: 'Klein Studio', contact: 'D. Klein', amt: 'USD 9.4k', days: 'Cerrado', svc: 'Web + SEO + Redes' },
    { co: 'Borealis Tours', contact: 'M. Calderón', amt: 'USD 5.1k', days: 'Cerrado', svc: 'Mantenimiento' },
  ] },
]

export function CommercialSection({ ui }: { ui: UiKit }) {
  const { Badge, Icon, KpiCard } = ui

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-title">2 Comercial</div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 16 }}>
        <KpiCard icon="sparkles" label="Leads nuevos" value="142" delta={{ dir: 'up', value: '+18%' }} trend={[8, 11, 9, 14, 16, 12, 18, 22, 19, 24, 21, 28]} chartColor="#5B5BF7" />
        <KpiCard icon="search" label="Prospectos activos" value="248" delta={{ dir: 'up', value: '+31' }} trend={[180, 188, 192, 201, 210, 218, 224, 231, 236, 241, 244, 248]} chartColor="#A78BFA" />
        <KpiCard icon="flow" label="Pipeline" value="76.3k" unit="USD" delta={{ dir: 'up', value: '+12%' }} trend={[42, 48, 46, 52, 58, 61, 64, 67, 70, 73, 74, 76]} chartColor="#22D3EE" />
        <KpiCard icon="target" label="Forecast comercial" value="Mock" delta={{ dir: 'flat', value: 'UX only' }} trend={[12, 13, 13, 14, 15, 15, 16, 17, 17, 18, 18, 19]} chartColor="#9CA3AF" />
        <KpiCard icon="trend" label="Conversión de pipeline" value="Pendiente" delta={{ dir: 'flat', value: 'Placeholder' }} trend={[10, 10, 11, 11, 12, 12, 13, 13, 13, 14, 14, 14]} chartColor="#9CA3AF" />
        <KpiCard icon="card" label="Valor potencial" value="76.3k" unit="USD" delta={{ dir: 'up', value: '+9.4k' }} trend={[24, 28, 30, 34, 36, 40, 44, 46, 52, 58, 66, 76]} chartColor="#10B981" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            Pipeline comercial
            <span className="badge outline" style={{ marginLeft: 6 }}>14 deals · USD 76.3k</span>
          </div>
          <div className="row gap-sm">
            <button className="btn btn-sm btn-ghost"><Icon.filter size={13} /> Filtrar</button>
            <button className="btn btn-sm"><Icon.external size={13} /> Abrir Growth</button>
          </div>
        </div>
        <div className="card-body">
          <div className="pipeline">
            {PIPELINE.map((stage) => {
              const total = stage.deals.reduce((acc, deal) => acc + Number.parseFloat(deal.amt.replace(/[^0-9.]/g, '')), 0)
              return (
                <div key={stage.name} className="pipeline-col">
                  <div className="pipeline-col-head">
                    <div className="h">
                      <span className="stagebar" style={{ background: stage.color }} />
                      {stage.name}
                      <span className="count">{stage.deals.length}</span>
                    </div>
                    <span className="val">USD {total.toFixed(1)}k</span>
                  </div>
                  {stage.deals.map((deal) => (
                    <div key={`${stage.name}-${deal.co}`} className="deal">
                      <div className="deal-name">{deal.co}</div>
                      <div className="deal-meta">{deal.contact}</div>
                      <div className="deal-meta"><Icon.layers size={11} /> {deal.svc}</div>
                      <div className="deal-foot">
                        <span className="deal-amount">{deal.amt}</span>
                        <Badge tone="outline">{deal.days}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
