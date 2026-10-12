import type { EventEntry, TrendSeries } from '../types'
import { EMPTY_TREND } from '../types'
import { EventsPanel } from './EventsPanel'
import { TrendChart } from './TrendChart'

export function BgpCharts({
  trend,
  hijacks,
  leaks,
  globalTrend,
}: {
  trend?: TrendSeries
  hijacks?: EventEntry[]
  leaks?: EventEntry[]
  globalTrend?: TrendSeries
}) {
  const regionTrend = trend ?? EMPTY_TREND
  const fallback = globalTrend ?? EMPTY_TREND
  const series =
    regionTrend.values.length > 0
      ? [{ name: 'BGP 更新', data: regionTrend, color: '#f0b429' }]
      : [{ name: 'BGP 更新（全球）', data: fallback, color: '#f0b429' }]

  return (
    <>
      <TrendChart
        title="BGP 趋势"
        subtitle="近 7 天 BGP 路由更新量"
        wide
        series={series}
      />
      <EventsPanel
        title="BGP 劫持"
        subtitle="疑似前缀劫持事件"
        events={hijacks ?? []}
        limit={8}
      />
      <EventsPanel
        title="BGP 泄漏"
        subtitle="路由泄漏事件"
        events={leaks ?? []}
        limit={8}
      />
    </>
  )
}
