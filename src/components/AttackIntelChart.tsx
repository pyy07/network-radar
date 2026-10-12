import type { ShareMap } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'

export function AttackIntelChart({
  industry,
  mitigation,
}: {
  industry: ShareMap
  mitigation: ShareMap
}) {
  return (
    <>
      <Panel title="攻击情报 · 行业" subtitle="近 7 天 L7 攻击目标行业占比">
        <ShareBarChart data={industry} limit={10} />
      </Panel>
      <Panel title="攻击情报 · 防护" subtitle="缓解产品分布（Mitigation）">
        <ShareBarChart data={mitigation} limit={10} />
      </Panel>
    </>
  )
}
