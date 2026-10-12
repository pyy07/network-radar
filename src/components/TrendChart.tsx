import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import {
  chartColors,
  gridLine,
  textMuted,
  textPrimary,
} from '../lib/chartTheme'
import type { TrendSeries } from '../types'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'

type TrendChartProps = {
  title: string
  subtitle?: string
  series: Array<{ name: string; data: TrendSeries; color?: string }>
  wide?: boolean
}

function formatTick(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function TrendChart({ title, subtitle, series, wide }: TrendChartProps) {
  const option = useMemo(() => {
    const primary = series.find((s) => s.data.timestamps.length > 0)
    if (!primary) return null

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: {
        top: 0,
        textStyle: { color: textMuted },
      },
      grid: { left: 48, right: 20, top: 40, bottom: 36 },
      xAxis: {
        type: 'category',
        data: primary.data.timestamps.map(formatTick),
        axisLabel: { color: textMuted },
        axisLine: { lineStyle: { color: gridLine } },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: textMuted },
        splitLine: { lineStyle: { color: gridLine } },
      },
      series: series
        .filter((s) => s.data.values.length > 0)
        .map((s, i) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: s.data.values,
          itemStyle: { color: s.color ?? chartColors[i % chartColors.length] },
          lineStyle: { width: 2.2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: `${s.color ?? chartColors[i % chartColors.length]}55`,
                },
                { offset: 1, color: 'transparent' },
              ],
            },
          },
        })),
      textStyle: { color: textPrimary },
    }
  }, [series])

  return (
    <Panel title={title} subtitle={subtitle} wide={wide}>
      {!option ? (
        <EmptyState message="暂无趋势数据，请重新拉取快照" />
      ) : (
        <ReactECharts option={option} style={{ height: 300, width: '100%' }} />
      )}
    </Panel>
  )
}
