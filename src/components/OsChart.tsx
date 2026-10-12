import type { ShareMap } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'

export function OsChart({ data }: { data: ShareMap }) {
  return (
    <Panel title="操作系统" subtitle="近 7 天 OS 分布">
      <ShareBarChart data={data} />
    </Panel>
  )
}
