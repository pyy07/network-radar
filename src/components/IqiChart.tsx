import type { IqiData, IqiPercentiles } from '../types'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'

const METRICS: {
  key: keyof IqiData
  label: string
  unit: string
}[] = [
  { key: 'bandwidth', label: '带宽', unit: 'Mbps 量级' },
  { key: 'latency', label: '延迟', unit: 'ms' },
  { key: 'dns', label: 'DNS', unit: 'ms' },
]

function hasValues(p?: IqiPercentiles): boolean {
  if (!p) return false
  return [p.p25, p.p50, p.p75].some((v) => Number(v) > 0)
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n >= 100 ? n.toFixed(1) : n.toFixed(2)
}

export function IqiChart({ data }: { data?: IqiData }) {
  const ready = METRICS.some((m) => hasValues(data?.[m.key]))

  return (
    <Panel title="网络质量 IQI" subtitle="带宽 / 延迟 / DNS 百分位（P25 / P50 / P75）">
      {!ready ? (
        <EmptyState message="暂无 IQI 数据" />
      ) : (
        <div className="iqi-grid">
          {METRICS.map((m) => {
            const p = data?.[m.key]
            return (
              <div key={m.key} className="iqi-card">
                <div className="iqi-card__head">
                  <strong>{m.label}</strong>
                  <span>{m.unit}</span>
                </div>
                <dl className="iqi-card__stats">
                  <div>
                    <dt>P25</dt>
                    <dd>{formatNum(p?.p25 ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>P50</dt>
                    <dd>{formatNum(p?.p50 ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>P75</dt>
                    <dd>{formatNum(p?.p75 ?? 0)}</dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
