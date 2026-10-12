import ReactECharts from 'echarts-for-react'
import {
  chartColors,
  gridLine,
  shareEntries,
  textMuted,
  textPrimary,
} from '../lib/chartTheme'
import { EmptyState } from './EmptyState'

type ShareBarChartProps = {
  data: Record<string, number>
  labelFn?: (key: string) => string
  horizontal?: boolean
  limit?: number
}

export function ShareBarChart({
  data,
  labelFn,
  horizontal = true,
  limit = 10,
}: ShareBarChartProps) {
  const entries = shareEntries(data, limit).map((d) => ({
    ...d,
    name: labelFn ? labelFn(d.name) : d.name,
  }))

  if (entries.length === 0) {
    return <EmptyState />
  }

  const names = entries.map((d) => d.name)
  const values = entries.map((d) => d.value)

  const option = horizontal
    ? {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 100, right: 28, top: 16, bottom: 24 },
        xAxis: {
          type: 'value',
          axisLabel: { color: textMuted, formatter: '{value}%' },
          splitLine: { lineStyle: { color: gridLine } },
        },
        yAxis: {
          type: 'category',
          data: names.slice().reverse(),
          axisLabel: { color: textPrimary },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          {
            type: 'bar',
            data: values.slice().reverse(),
            barMaxWidth: 18,
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: (params: { dataIndex: number }) =>
                chartColors[params.dataIndex % chartColors.length],
            },
            label: {
              show: true,
              position: 'right',
              color: textMuted,
              formatter: '{c}%',
            },
          },
        ],
      }
    : {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 16, top: 24, bottom: 48 },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: textMuted, rotate: 30 },
          axisLine: { lineStyle: { color: gridLine } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: textMuted, formatter: '{value}%' },
          splitLine: { lineStyle: { color: gridLine } },
        },
        series: [
          {
            type: 'bar',
            data: values,
            barMaxWidth: 28,
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: (params: { dataIndex: number }) =>
                chartColors[params.dataIndex % chartColors.length],
            },
          },
        ],
      }

  return (
    <ReactECharts option={option} style={{ height: 280, width: '100%' }} />
  )
}
