import type { ShareMap, TrendSeries } from '../types'
import { EMPTY_TREND } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'
import { TrendChart } from './TrendChart'

export function DnsCharts({
  trend,
  queryType,
  protocol,
}: {
  trend?: TrendSeries
  queryType?: ShareMap
  protocol?: ShareMap
}) {
  return (
    <>
      <TrendChart
        title="DNS 趋势"
        subtitle="近 7 天 DNS 查询量"
        wide
        series={[
          {
            name: 'DNS',
            data: trend ?? EMPTY_TREND,
            color: '#c792ea',
          },
        ]}
      />
      <Panel title="DNS 查询类型" subtitle="QUERY_TYPE 分布">
        <ShareBarChart data={queryType ?? {}} limit={10} />
      </Panel>
      <Panel title="DNS 协议" subtitle="UDP / TCP / HTTPS / TLS">
        <ShareBarChart data={protocol ?? {}} limit={8} />
      </Panel>
    </>
  )
}
