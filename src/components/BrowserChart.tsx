import type { ShareMap } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'

export function BrowserChart({ data }: { data: ShareMap }) {
  return (
    <Panel title="浏览器" subtitle="浏览器家族占比">
      <ShareBarChart data={data} />
    </Panel>
  )
}
