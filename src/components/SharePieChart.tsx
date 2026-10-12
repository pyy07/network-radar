import ReactECharts from 'echarts-for-react'
import {
  chartColors,
  shareEntries,
  textMuted,
  textPrimary,
} from '../lib/chartTheme'
import { EmptyState } from './EmptyState'

type SharePieChartProps = {
  data: Record<string, number>
  labelFn?: (key: string) => string
}

export function SharePieChart({ data, labelFn }: SharePieChartProps) {
  const entries = shareEntries(data).map((d) => ({
    ...d,
    name: labelFn ? labelFn(d.name) : d.name,
  }))

  if (entries.length === 0) {
    return <EmptyState />
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: {
      bottom: 0,
      textStyle: { color: textMuted },
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#0f1624', borderWidth: 2 },
        label: { color: textPrimary, formatter: '{b}\n{c}%' },
        data: entries.map((d, i) => ({
          ...d,
          itemStyle: { color: chartColors[i % chartColors.length] },
        })),
      },
    ],
  }

  return (
    <ReactECharts option={option} style={{ height: 280, width: '100%' }} />
  )
}
