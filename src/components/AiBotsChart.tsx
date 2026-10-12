import type { ShareMap } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'

export function AiBotsChart({ data }: { data: ShareMap }) {
  return (
    <Panel title="AI 爬虫" subtitle="AI Bot User-Agent 流量占比" wide>
      <ShareBarChart data={data} limit={12} />
    </Panel>
  )
}
