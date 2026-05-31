import clsx from 'clsx'

interface StatusBadgeProps {
  children: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'
  dot?: boolean
}

export function StatusBadge({ children, tone = 'default', dot = false }: StatusBadgeProps) {
  return (
    <span className={clsx('badge', tone !== 'default' && tone)}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}
