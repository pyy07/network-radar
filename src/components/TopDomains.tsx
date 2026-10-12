import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  chartColors,
  gridLine,
  textMuted,
  textPrimary,
} from '../lib/chartTheme'
import type { DomainEntry, RegionData } from '../types'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'

const EU_COUNTRIES = [
  { id: 'de', label: '德国' },
  { id: 'fr', label: '法国' },
  { id: 'gb', label: '英国' },
] as const

type TopDomainsProps = {
  data: RegionData
}

export function TopDomains({ data }: TopDomainsProps) {
  const isEu = data.region === 'eu'
  const [country, setCountry] = useState<(typeof EU_COUNTRIES)[number]['id']>(
    'de',
  )

  const domains: DomainEntry[] = useMemo(() => {
    if (isEu) {
      return data.topDomainsByCountry?.[country] ?? []
    }
    return data.topDomains ?? []
  }, [country, data.topDomains, data.topDomainsByCountry, isEu])

  const option = useMemo(() => {
    const names = domains.map((d) => d.domain).reverse()
    const ranks = domains.map((d) => Math.max(21 - d.rank, 1)).reverse()

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { dataIndex: number }[]) => {
          const idx = domains.length - 1 - (params[0]?.dataIndex ?? 0)
          const item = domains[idx]
          if (!item) return ''
          const cats = item.categories.join(', ') || '—'
          return `#${item.rank} ${item.domain}<br/>类别: ${cats}`
        },
      },
      grid: { left: 140, right: 24, top: 12, bottom: 16 },
      xAxis: {
        type: 'value',
        show: false,
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: textPrimary },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: gridLine } },
      },
      series: [
        {
          type: 'bar',
          data: ranks,
          barMaxWidth: 16,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (params: { dataIndex: number }) =>
              chartColors[params.dataIndex % chartColors.length],
          },
          label: {
            show: true,
            position: 'right',
            color: textMuted,
            formatter: (params: { dataIndex: number }) => {
              const idx = domains.length - 1 - params.dataIndex
              return `#${domains[idx]?.rank ?? ''}`
            },
          },
        },
      ],
    }
  }, [domains])

  return (
    <Panel
      title="Top 网站"
      subtitle={
        isEu
          ? '欧洲 Ranking 按国家展示（DE / FR / GB）'
          : '各地区热门域名排名'
      }
      wide
      action={
        isEu ? (
          <div className="subtabs" role="tablist">
            {EU_COUNTRIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={country === c.id}
                className={`subtabs__btn${country === c.id ? ' is-active' : ''}`}
                onClick={() => setCountry(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null
      }
    >
      {domains.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="top-domains">
          <ReactECharts
            option={option}
            style={{ height: 360, width: '100%' }}
          />
          <div className="domain-table-wrap">
            <table className="domain-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>域名</th>
                  <th>类别</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={`${d.rank}-${d.domain}`}>
                    <td>{d.rank}</td>
                    <td>{d.domain}</td>
                    <td>{d.categories.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  )
}
