import type { BadgeTone, UiKit } from './DashboardV2'

type IntegrationStatus = 'Connected' | 'Warning' | 'Disconnected'

const INTEGRATIONS: Array<{ name: string; status: IntegrationStatus; lastSync: string }> = [
  { name: 'Meta', status: 'Connected', lastSync: 'hace 12 min' },
  { name: 'Google Ads', status: 'Warning', lastSync: 'hace 2 h' },
  { name: 'GA4', status: 'Connected', lastSync: 'hace 18 min' },
  { name: 'Search Console', status: 'Connected', lastSync: 'hace 44 min' },
  { name: 'Instagram', status: 'Connected', lastSync: 'hace 8 min' },
  { name: 'TikTok', status: 'Disconnected', lastSync: 'pendiente' },
  { name: 'LinkedIn', status: 'Warning', lastSync: 'hace 1 d' },
  { name: 'Tienda Nube', status: 'Connected', lastSync: 'hace 21 min' },
  { name: 'Shopify', status: 'Connected', lastSync: 'hace 16 min' },
  { name: 'WooCommerce', status: 'Disconnected', lastSync: 'pendiente' },
  { name: 'Kommo', status: 'Connected', lastSync: 'hace 35 min' },
  { name: 'Pipedrive', status: 'Connected', lastSync: 'hace 28 min' },
  { name: 'Close', status: 'Disconnected', lastSync: 'pendiente' },
  { name: 'Inspyra Mail', status: 'Connected', lastSync: 'hace 6 min' },
  { name: 'Marketing Nube', status: 'Warning', lastSync: 'hace 3 h' },
]

function toneForStatus(status: IntegrationStatus): BadgeTone {
  if (status === 'Connected') return 'success'
  if (status === 'Warning') return 'warning'
  return 'outline'
}

export function IntegrationsSection({ ui }: { ui: UiKit }) {
  const { Badge, Icon, StatusDot } = ui

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-title">5 Integraciones</div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Estado de conexión</div>
          <div className="row gap-sm">
            <Badge tone="success" dot>Connected</Badge>
            <Badge tone="warning" dot>Warning</Badge>
            <Badge tone="outline">Disconnected</Badge>
          </div>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {INTEGRATIONS.map((integration) => (
              <div key={integration.name} className="card" style={{ padding: 14, boxShadow: 'none' }}>
                <div className="row between" style={{ marginBottom: 10 }}>
                  <span className="row gap-sm">
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-700)' }}>
                      <Icon.link size={14} />
                    </span>
                    <span className="cell-strong">{integration.name}</span>
                  </span>
                  <StatusDot tone={integration.status === 'Connected' ? 'success' : integration.status === 'Warning' ? 'warning' : 'default'} />
                </div>
                <div className="row between" style={{ fontSize: 11.5 }}>
                  <Badge tone={toneForStatus(integration.status)}>{integration.status}</Badge>
                  <span className="cell-muted">{integration.lastSync}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
