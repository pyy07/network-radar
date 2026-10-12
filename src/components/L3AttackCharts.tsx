import type { ShareMap, TrendSeries } from '../types'
import { EMPTY_TREND } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'
import { TrendChart } from './TrendChart'

export function L3AttackCharts({
  trend,
  protocol,
  vector,
  industry,
}: {
  trend?: TrendSeries
  protocol?: ShareMap
  vector?: ShareMap
  industry?: ShareMap
}) {
  return (
    <>
      <TrendChart
        title="L3 攻击趋势"
        subtitle="近 7 天三层攻击量（目标视角）"
        wide
        series={[
          {
            name: 'L3',
            data: trend ?? EMPTY_TREND,
            color: '#f07178',
          },
        ]}
      />
      <Panel title="L3 协议" subtitle="UDP / TCP / ICMP / GRE">
        <ShareBarChart data={protocol ?? {}} />
      </Panel>
      <Panel title="L3 攻击向量" subtitle="VECTOR 分布">
        <ShareBarChart data={vector ?? {}} limit={10} />
      </Panel>
      <Panel title="L3 目标行业" subtitle="INDUSTRY 分布" wide>
        <ShareBarChart data={industry ?? {}} limit={12} />
      </Panel>
    </>
  )
}
