import type { EventEntry } from '../types'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { hour12: false })
}

function kindLabel(event: EventEntry): string {
  if (event.kind === 'outage' || event.eventType === 'OUTAGE') return '中断'
  if (event.kind === 'anomaly' || event.eventType === 'TRAFFIC_ANOMALY')
    return '异常'
  if (event.kind === 'bgp_hijack' || event.eventType === 'BGP_HIJACK')
    return '劫持'
  if (event.kind === 'bgp_leak' || event.eventType === 'BGP_LEAK') return '泄漏'
  return event.eventType || '事件'
}

function tagClass(event: EventEntry): string {
  if (event.kind === 'anomaly' || event.eventType === 'TRAFFIC_ANOMALY')
    return 'anomaly'
  if (event.kind === 'bgp_hijack' || event.eventType === 'BGP_HIJACK')
    return 'hijack'
  if (event.kind === 'bgp_leak' || event.eventType === 'BGP_LEAK') return 'leak'
  return 'outage'
}

type EventsPanelProps = {
  title: string
  subtitle?: string
  events: EventEntry[]
  wide?: boolean
  limit?: number
}

export function EventsPanel({
  title,
  subtitle,
  events,
  wide,
  limit = 12,
}: EventsPanelProps) {
  const rows = events.slice(0, limit)

  return (
    <Panel title={title} subtitle={subtitle} wide={wide}>
      {rows.length === 0 ? (
        <EmptyState message="该范围内暂无事件/中断记录" />
      ) : (
        <div className="event-list">
          {rows.map((event) => (
            <article key={event.id} className="event-card">
              <div className="event-card__meta">
                <span className={`event-tag event-tag--${tagClass(event)}`}>
                  {kindLabel(event)}
                </span>
                <time>{formatTime(event.startDate)}</time>
              </div>
              <h3 className="event-card__title">{event.description || '未命名事件'}</h3>
              <p className="event-card__detail">
                {[
                  event.locationNames.join('、') ||
                    event.locations.join(', ') ||
                    null,
                  event.outageCause,
                  event.outageType,
                  event.status,
                  event.scope,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}
