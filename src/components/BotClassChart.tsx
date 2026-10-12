import { labelBotClass } from '../lib/chartTheme'
import type { ShareMap } from '../types'
import { Panel } from './Panel'
import { SharePieChart } from './SharePieChart'

export function BotClassChart({ data }: { data: ShareMap }) {
  return (
    <Panel title="人机分流" subtitle="LIKELY_HUMAN vs LIKELY_AUTOMATED">
      <SharePieChart data={data} labelFn={labelBotClass} />
    </Panel>
  )
}
