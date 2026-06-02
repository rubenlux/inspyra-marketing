import { AiSection } from './AiSection'
import { CommercialSection } from './CommercialSection'
import { ExecutiveSection } from './ExecutiveSection'
import { IntegrationsSection } from './IntegrationsSection'
import { OperationsSection } from './OperationsSection'
import { TeamSection } from './TeamSection'

type IconProps = {
  size?: number
  stroke?: number
}

type IconComponent = (props: IconProps) => JSX.Element

export type BadgeTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand'
  | 'cyan'
  | 'outline'

export type IconName = keyof typeof Icon

export type TrendDirection = 'up' | 'down' | 'flat'

export type UiKit = {
  Badge: typeof Badge
  Icon: typeof Icon
  KpiCard: typeof KpiCard
  Spark: typeof Spark
  StatusDot: typeof StatusDot
}

function Ic({ d, size = 16, stroke = 1.6 }: IconProps & { d: JSX.Element }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {d}
    </svg>
  )
}

const Icon = {
  arrowDown: (p: IconProps) => <Ic {...p} d={<><path d="M12 5v14M5 12l7 7 7-7" /></>} />,
  arrowRight: (p: IconProps) => <Ic {...p} d={<><path d="M5 12h14M13 5l7 7-7 7" /></>} />,
  arrowUp: (p: IconProps) => <Ic {...p} d={<><path d="M12 19V5M5 12l7-7 7 7" /></>} />,
  beaker: (p: IconProps) => <Ic {...p} d={<><path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" /><path d="M8 3h8" /><path d="M6 14h12" /></>} />,
  building: (p: IconProps) => <Ic {...p} d={<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></>} />,
  calendar: (p: IconProps) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>} />,
  card: (p: IconProps) => <Ic {...p} d={<><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></>} />,
  chart: (p: IconProps) => <Ic {...p} d={<><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" /></>} />,
  check2: (p: IconProps) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m8 12 3 3 5-6" /></>} />,
  chevronDown: (p: IconProps) => <Ic {...p} d={<><path d="m6 9 6 6 6-6" /></>} />,
  clock: (p: IconProps) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  download: (p: IconProps) => <Ic {...p} d={<><path d="M12 3v12M6 11l6 6 6-6M4 21h16" /></>} />,
  external: (p: IconProps) => <Ic {...p} d={<><path d="M15 3h6v6" /><path d="M10 14 21 3M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></>} />,
  filter: (p: IconProps) => <Ic {...p} d={<><path d="M4 5h16l-6 8v6l-4-2v-4z" /></>} />,
  flow: (p: IconProps) => <Ic {...p} d={<><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><circle cx="5" cy="18" r="2" /><path d="M7 6h10M7 18h10M5 8v8M19 8v8" /></>} />,
  grid: (p: IconProps) => <Ic {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>} />,
  layers: (p: IconProps) => <Ic {...p} d={<><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5M3 18l9 5 9-5" /></>} />,
  life: (p: IconProps) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="m4.9 4.9 4.3 4.3M14.8 14.8l4.3 4.3M4.9 19.1l4.3-4.3M14.8 9.2l4.3-4.3" /></>} />,
  link: (p: IconProps) => <Ic {...p} d={<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17" /></>} />,
  more: (p: IconProps) => <Ic {...p} d={<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>} />,
  plus: (p: IconProps) => <Ic {...p} d={<><path d="M12 5v14M5 12h14" /></>} />,
  pulse: (p: IconProps) => <Ic {...p} d={<><path d="M3 12h4l3-8 4 16 3-8h4" /></>} />,
  robot: (p: IconProps) => <Ic {...p} d={<><rect x="4" y="8" width="16" height="11" rx="2.5" /><path d="M12 8V4M12 4h-1.5M12 4h1.5" /><circle cx="9" cy="13" r="1.2" fill="currentColor" /><circle cx="15" cy="13" r="1.2" fill="currentColor" /><path d="M9.5 16.5h5M2 12v3M22 12v3" /></>} />,
  rocket: (p: IconProps) => <Ic {...p} d={<><path d="M14 4c5 0 6 2 6 6-3 0-4 1-6 3l-4 4-4-4 4-4c2-2 3-3 3-6 0 0 1-3 1 1z" /><path d="m6 16-2 4 4-2" /><circle cx="14" cy="10" r="1.4" /></>} />,
  search: (p: IconProps) => <Ic {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />,
  shield: (p: IconProps) => <Ic {...p} d={<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /></>} />,
  sparkles: (p: IconProps) => <Ic {...p} d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>} />,
  target: (p: IconProps) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>} />,
  trend: (p: IconProps) => <Ic {...p} d={<><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>} />,
  users: (p: IconProps) => <Ic {...p} d={<><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M17 11a4 4 0 0 0 0-8" /><path d="M22 21a7 7 0 0 0-5-6.7" /></>} />,
} satisfies Record<string, IconComponent>

function Badge({
  tone = 'default',
  dot,
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  children: React.ReactNode
}) {
  return (
    <span className={`badge ${tone === 'default' ? '' : tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}

function Spark({
  data,
  color = '#0B0D12',
  w = 84,
  h = 28,
  fill,
}: {
  data: number[]
  color?: string
  w?: number
  h?: number
  fill?: string
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((value, index) => [
    (index / (data.length - 1)) * w,
    h - 2 - ((value - min) / range) * (h - 4),
  ])
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ')
  const area = fill ? `${path} L${w},${h} L0,${h} Z` : undefined

  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && area && <path d={area} fill={fill} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatusDot({ tone }: { tone: 'success' | 'warning' | 'danger' | 'brand' | 'default' }) {
  const colors = {
    brand: 'var(--primary)',
    danger: 'var(--danger)',
    default: 'var(--ink-400)',
    success: 'var(--success)',
    warning: 'var(--warning)',
  }

  return <span style={{ width: 7, height: 7, borderRadius: 999, background: colors[tone], display: 'inline-block' }} />
}

function KpiCard({
  icon,
  label,
  value,
  unit,
  delta,
  trend,
  chartColor = '#0B0D12',
  chartFill,
}: {
  icon: IconName
  label: string
  value: string
  unit?: string
  delta: { dir: TrendDirection; value: string }
  trend: number[]
  chartColor?: string
  chartFill?: string
}) {
  const IconC = Icon[icon]

  return (
    <div className="kpi">
      <div className="kpi-head">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="kpi-icon"><IconC size={14} /></span>
          {label}
        </span>
        <button className="icon-btn" style={{ width: 22, height: 22, background: 'transparent', border: 0 }}>
          <Icon.more size={14} />
        </button>
      </div>
      <div className="kpi-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="row between">
        <span className={`kpi-delta ${delta.dir}`}>
          {delta.dir === 'up' && <Icon.arrowUp size={10} stroke={2.4} />}
          {delta.dir === 'down' && <Icon.arrowDown size={10} stroke={2.4} />}
          {delta.value}
        </span>
        <Spark data={trend} color={chartColor} fill={chartFill} w={90} h={28} />
      </div>
    </div>
  )
}

const ui: UiKit = {
  Badge,
  Icon,
  KpiCard,
  Spark,
  StatusDot,
}

export default function DashboardV2() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Buenos días, Mateo</h1>
          <p>Resumen ejecutivo de Studio Inspyra ERP · Martes 2 de junio, 2026</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14} /> Este mes <Icon.chevronDown size={12} /></button>
          <button className="btn"><Icon.download size={14} /> Exportar</button>
          <button className="btn btn-primary"><Icon.plus size={14} /> Nuevo</button>
        </div>
      </div>

      <ExecutiveSection ui={ui} />
      <CommercialSection ui={ui} />
      <OperationsSection ui={ui} />
      <TeamSection ui={ui} />
      <IntegrationsSection ui={ui} />
      <AiSection ui={ui} />
    </div>
  )
}
