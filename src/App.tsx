import { useEffect, useMemo, useState } from 'react'
import { AiBotsChart } from './components/AiBotsChart'
import { AttackIntelChart } from './components/AttackIntelChart'
import { BgpCharts } from './components/BgpCharts'
import { BotClassChart } from './components/BotClassChart'
import { BrowserChart } from './components/BrowserChart'
import { DeviceChart } from './components/DeviceChart'
import { DnsCharts } from './components/DnsCharts'
import { EmailCharts } from './components/EmailCharts'
import { EventsPanel } from './components/EventsPanel'
import { IqiChart } from './components/IqiChart'
import { L3AttackCharts } from './components/L3AttackCharts'
import { OsChart } from './components/OsChart'
import { TopDomains } from './components/TopDomains'
import { TrendChart } from './components/TrendChart'
import { loadAllRegions, loadIntel, loadMeta } from './lib/loadData'
import type {
  IntelData,
  MetaData,
  RegionData,
  RegionId,
} from './types'
import { EMPTY_TREND } from './types'
import './App.css'

const REGIONS: { id: RegionId; label: string; hint: string }[] = [
  { id: 'cn', label: '中国', hint: 'CN' },
  { id: 'us', label: '美国', hint: 'US' },
  { id: 'eu', label: '欧洲', hint: 'EU' },
]

const EU_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB', 'IS', 'NO', 'CH', 'EU',
]

function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { hour12: false })
}

function filterByRegion<T extends { locations?: string[] }>(
  items: T[] | undefined,
  region: RegionId,
): T[] {
  return (items ?? []).filter((e) => {
    const codes = (e.locations ?? []).map((c) => c.toUpperCase())
    if (region === 'cn') return codes.includes('CN')
    if (region === 'us') return codes.includes('US')
    return codes.some((c) => EU_CODES.includes(c))
  })
}

export default function App() {
  const [region, setRegion] = useState<RegionId>('cn')
  const [meta, setMeta] = useState<MetaData | null>(null)
  const [intel, setIntel] = useState<IntelData | null>(null)
  const [datasets, setDatasets] = useState<Partial<Record<RegionId, RegionData>>>(
    {},
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      setLoading(true)
      setError(null)
      try {
        const [nextMeta, nextIntel] = await Promise.all([loadMeta(), loadIntel()])
        const regions = nextMeta.regions?.length
          ? nextMeta.regions
          : (['cn', 'us', 'eu'] as RegionId[])
        const nextData = await loadAllRegions(regions)
        if (!cancelled) {
          setMeta(nextMeta)
          setIntel(nextIntel)
          setDatasets(nextData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const current = datasets[region]
  const updatedAt = useMemo(
    () => current?.fetchedAt ?? meta?.fetchedAt,
    [current?.fetchedAt, meta?.fetchedAt],
  )

  const regionEvents = current?.events?.length
    ? current.events
    : filterByRegion(intel?.events, region)

  const bgpHijacks = current?.bgpHijacks?.length
    ? current.bgpHijacks
    : filterByRegion(intel?.bgpHijacks, region)

  const bgpLeaks = current?.bgpLeaks?.length
    ? current.bgpLeaks
    : filterByRegion(intel?.bgpLeaks, region)

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />
      <header className="hero">
        <div className="hero__brand">
          <p className="hero__eyebrow">全球网络流量快照</p>
          <h1 className="hero__title">Network Radar</h1>
          <p className="hero__desc">
            覆盖网站画像、流量趋势、DNS、L3/L7 攻击、BGP
            与邮箱安全等多维网络情报。
          </p>
        </div>
        <div className="hero__meta">
          <div className="meta-card">
            <span className="meta-card__label">数据更新</span>
            <strong className="meta-card__value">{formatTime(updatedAt)}</strong>
          </div>
        </div>
      </header>

      <nav className="region-tabs" aria-label="地区切换">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`region-tabs__btn${region === r.id ? ' is-active' : ''}`}
            onClick={() => setRegion(r.id)}
          >
            <span>{r.label}</span>
            <small>{r.hint}</small>
          </button>
        ))}
      </nav>

      {loading ? <div className="status-banner">正在加载快照…</div> : null}
      {error ? <div className="status-banner status-banner--error">{error}</div> : null}
      {!loading && !error && !current ? (
        <div className="status-banner">暂无快照，请先运行数据采集。</div>
      ) : null}

      {current ? (
        <main className="grid">
          <TopDomains data={current} />
          <DeviceChart data={current.deviceType} />
          <OsChart data={current.os} />
          <BrowserChart data={current.browserFamily} />
          <BotClassChart data={current.botClass} />
          <AiBotsChart data={current.aiBots} />

          <TrendChart
            title="流量趋势"
            subtitle="近 7 天 HTTP 请求量与网络流量"
            wide
            series={[
              {
                name: 'HTTP',
                data: current.httpTrend ?? EMPTY_TREND,
                color: '#3d9cf0',
              },
              {
                name: 'NetFlow',
                data: current.netflowTrend ?? EMPTY_TREND,
                color: '#4fd1a5',
              },
            ]}
          />

          <DnsCharts
            trend={current.dnsTrend}
            queryType={current.dnsQueryType}
            protocol={current.dnsProtocol}
          />

          <L3AttackCharts
            trend={current.l3Trend}
            protocol={current.l3Protocol}
            vector={current.l3Vector}
            industry={current.l3Industry}
          />

          <BgpCharts
            trend={current.bgpTrend}
            hijacks={bgpHijacks}
            leaks={bgpLeaks}
            globalTrend={intel?.bgpTrend}
          />

          <EmailCharts data={current.email ?? intel?.email} />

          <EventsPanel
            title="地区事件"
            subtitle="中断与流量异常（按当前地区过滤）"
            events={regionEvents}
          />
          <EventsPanel
            title="全球情报流"
            subtitle="近期全球中断、异常与 BGP 事件"
            events={intel?.events ?? []}
            limit={12}
          />

          <AttackIntelChart
            industry={current.attackIndustry ?? {}}
            mitigation={current.attackMitigation ?? {}}
          />

          <IqiChart data={current.iqi} />
        </main>
      ) : null}

      {meta?.errors?.length ? (
        <footer className="footer">
          <span className="footer__warn">
            最近采集告警：{meta.errors.join('；')}
          </span>
        </footer>
      ) : null}
    </div>
  )
}
