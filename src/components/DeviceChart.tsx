import type { ShareMap } from '../types'
import { Panel } from './Panel'
import { SharePieChart } from './SharePieChart'

export function DeviceChart({ data }: { data: ShareMap }) {
  return (
    <Panel title="设备" subtitle="HTTP 请求设备类型占比">
      <SharePieChart data={data} />
    </Panel>
  )
}
