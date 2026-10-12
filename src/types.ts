export type RegionId = 'cn' | 'us' | 'eu'

export type DomainEntry = {
  rank: number
  domain: string
  categories: string[]
}

export type ShareMap = Record<string, number>

export type TrendSeries = {
  timestamps: string[]
  values: number[]
}

export type EventEntry = {
  id: string
  kind: 'outage' | 'anomaly' | 'bgp_hijack' | 'bgp_leak' | string
  eventType: string
  description: string
  startDate: string | null
  endDate: string | null
  locations: string[]
  locationNames: string[]
  outageCause: string | null
  outageType: string | null
  scope: string | null
  linkedUrl: string | null
  status: string | null
}

export type IqiPercentiles = {
  p25: number
  p50: number
  p75: number
}

export type IqiData = {
  bandwidth: IqiPercentiles
  latency: IqiPercentiles
  dns: IqiPercentiles
}

export type EmailData = {
  spam: ShareMap
  malicious: ShareMap
  spoof: ShareMap
  threatCategory: ShareMap
  arc?: ShareMap
  dkim?: ShareMap
  dmarc?: ShareMap
  spf?: ShareMap
}

export type RegionData = {
  region: RegionId
  fetchedAt: string
  topDomains: DomainEntry[]
  topDomainsByCountry?: Record<string, DomainEntry[]>
  deviceType: ShareMap
  os: ShareMap
  browserFamily: ShareMap
  botClass: ShareMap
  aiBots: ShareMap
  httpTrend?: TrendSeries
  netflowTrend?: TrendSeries
  attackIndustry?: ShareMap
  attackMitigation?: ShareMap
  iqi?: IqiData
  dnsTrend?: TrendSeries
  dnsQueryType?: ShareMap
  dnsProtocol?: ShareMap
  l3Protocol?: ShareMap
  l3Vector?: ShareMap
  l3Industry?: ShareMap
  l3Trend?: TrendSeries
  bgpTrend?: TrendSeries
  bgpHijacks?: EventEntry[]
  bgpLeaks?: EventEntry[]
  email?: EmailData
  events?: EventEntry[]
}

export type IntelData = {
  fetchedAt: string
  outages: EventEntry[]
  anomalies: EventEntry[]
  bgpHijacks?: EventEntry[]
  bgpLeaks?: EventEntry[]
  bgpTrend?: TrendSeries
  email?: EmailData
  events: EventEntry[]
}

export type MetaData = {
  fetchedAt: string
  source: 'mock' | 'radar'
  regions: RegionId[]
  errors: string[]
}

export const EMPTY_TREND: TrendSeries = { timestamps: [], values: [] }
