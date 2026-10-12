export const chartColors = [
  '#3d9cf0',
  '#4fd1a5',
  '#f0b429',
  '#f07178',
  '#c792ea',
  '#82aaff',
  '#ebcb8b',
  '#88c0d0',
]

export const textMuted = '#8b9bb4'
export const textPrimary = '#e8eef8'
export const gridLine = 'rgba(255,255,255,0.06)'

export function shareEntries(
  map: Record<string, number>,
  limit = 10,
): { name: string; value: number }[] {
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .filter((d) => Number.isFinite(d.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function labelBotClass(key: string): string {
  const k = key.toUpperCase()
  if (k === 'LIKELY_HUMAN' || k === 'HUMAN') return '人类'
  if (k === 'LIKELY_AUTOMATED' || k === 'BOT' || k === 'AUTOMATED') return '机器人'
  return key
}
