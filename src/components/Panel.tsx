import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  wide?: boolean
}

export function Panel({ title, subtitle, action, children, wide }: PanelProps) {
  return (
    <section className={`panel${wide ? ' panel--wide' : ''}`}>
      <header className="panel__header">
        <div>
          <h2 className="panel__title">{title}</h2>
          {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}
