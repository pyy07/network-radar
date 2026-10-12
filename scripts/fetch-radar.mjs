import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'data')
const API_BASE = 'https://api.cloudflare.com/client/v4'
const DATE_RANGE = '7d'
const TOP_LIMIT = 20
const EVENT_LIMIT = 40

const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB', 'IS', 'NO', 'CH', 'EU',
])

const token = process.env.CF_API_TOKEN
if (!token) {
  console.error('Missing CF_API_TOKEN environment variable.')
  process.exit(1)
}

const errors = []

async function radarGet(pathname, params = {}) {
  const url = new URL(`${API_BASE}${pathname}`)
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item))
    } else {
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) {
    const msg =
      body?.errors?.map((e) => e.message).join('; ') ||
      `HTTP ${res.status} for ${pathname}`
    throw new Error(msg)
  }
  return body.result
}

async function soft(label, fn, fallback) {
  try {
    return await fn()
  } catch (err) {
    const message = `${label}: ${err.message}`
    errors.push(message)
    console.warn(message)
    return fallback
  }
}

function toShareMap(summary = {}) {
  const out = {}
  for (const [key, value] of Object.entries(summary)) {
    const num = Number(value)
    if (Number.isFinite(num)) out[key] = Number(num.toFixed(4))
  }
  return out
}

function mapDomains(top = []) {
  return top.map((item) => ({
    rank: item.rank,
    domain: item.domain,
    categories: (item.categories ?? []).map((c) => c.name).filter(Boolean),
  }))
}

function toTrend(serie = {}) {
  const timestamps = serie.timestamps ?? []
  let rawValues = serie.values
  // timeseries_groups style: timestamps + named series arrays
  if (!rawValues) {
    const key = Object.keys(serie).find(
      (k) => k !== 'timestamps' && Array.isArray(serie[k]),
    )
    if (key) rawValues = serie[key]
  }
  const values = (rawValues ?? []).map((v) => Number(v))
  return {
    timestamps,
    values: values.map((v) => (Number.isFinite(v) ? Number(v.toFixed(6)) : 0)),
  }
}

function extractSerie(result = {}) {
  if (result.serie_0) return toTrend(result.serie_0)
  for (const [key, value] of Object.entries(result)) {
    if (key === 'meta' || !value || typeof value !== 'object') continue
    if (Array.isArray(value.timestamps)) return toTrend(value)
  }
  return { timestamps: [], values: [] }
}

function emptyTrend() {
  return { timestamps: [], values: [] }
}

function emptyIqi() {
  return {
    bandwidth: { p25: 0, p50: 0, p75: 0 },
    latency: { p25: 0, p50: 0, p75: 0 },
    dns: { p25: 0, p50: 0, p75: 0 },
  }
}

function emptyEmail() {
  return {
    spam: {},
    malicious: {},
    spoof: {},
    threatCategory: {},
    arc: {},
    dkim: {},
    dmarc: {},
    spf: {},
  }
}

function mapOutage(item) {
  return {
    id: String(item.id ?? item.uuid ?? `${item.startDate}-${item.description}`),
    kind: 'outage',
    eventType: item.eventType ?? 'OUTAGE',
    description: item.description ?? '',
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
    locations: item.locations ?? item.locationsDetails?.map((l) => l.code) ?? [],
    locationNames:
      item.locationsDetails?.map((l) => l.name).filter(Boolean) ?? [],
    outageCause: item.outage?.outageCause ?? null,
    outageType: item.outage?.outageType ?? null,
    scope: item.scope ?? null,
    linkedUrl: item.linkedUrl ?? null,
    status: null,
  }
}

function mapAnomaly(item) {
  const code = item.locationDetails?.code
  return {
    id: String(item.uuid ?? `${item.startDate}-${code}`),
    kind: 'anomaly',
    eventType: 'TRAFFIC_ANOMALY',
    description:
      item.locationDetails?.name ||
      item.asnDetails?.name ||
      item.originDetails?.name ||
      'Traffic anomaly',
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
    locations: code ? [code] : [],
    locationNames: item.locationDetails?.name
      ? [item.locationDetails.name]
      : [],
    outageCause: null,
    outageType: item.type ?? null,
    scope: item.asnDetails?.name ?? item.originDetails?.name ?? null,
    linkedUrl: null,
    status: item.status ?? null,
  }
}

function matchesRegion(event, region) {
  const codes = (event.locations ?? []).map((c) => String(c).toUpperCase())
  if (region === 'cn') return codes.includes('CN')
  if (region === 'us') return codes.includes('US')
  if (region === 'eu') {
    return codes.some((c) => EU_COUNTRY_CODES.has(c))
  }
  return false
}

async function fetchHttpSummary(dimension, geo) {
  const result = await radarGet(`/radar/http/summary/${dimension}`, {
    dateRange: DATE_RANGE,
    ...geo,
  })
  return toShareMap(result.summary_0 ?? result.summary ?? {})
}

async function fetchAiBots(geo) {
  try {
    const result = await radarGet('/radar/ai/bots/summary/USER_AGENT', {
      dateRange: DATE_RANGE,
      ...geo,
    })
    return toShareMap(result.summary_0 ?? {})
  } catch (err) {
    const result = await radarGet('/radar/ai/bots/summary/user_agent', {
      dateRange: DATE_RANGE,
      ...geo,
    })
    errors.push(`AI bots primary path failed (${err.message}); used legacy path`)
    return toShareMap(result.summary_0 ?? {})
  }
}

async function fetchTopDomains(location) {
  const result = await radarGet('/radar/ranking/top', {
    location,
    rankingType: 'POPULAR',
    limit: TOP_LIMIT,
  })
  return mapDomains(result.top_0 ?? [])
}

async function fetchHttpTrend(geo) {
  const result = await radarGet('/radar/http/timeseries', {
    dateRange: DATE_RANGE,
    aggInterval: '1d',
    ...geo,
  })
  return toTrend(result.serie_0 ?? {})
}

async function fetchNetflowTrend(geo) {
  const result = await radarGet('/radar/netflows/timeseries', {
    dateRange: DATE_RANGE,
    aggInterval: '1d',
    product: 'ALL',
    ...geo,
  })
  return toTrend(result.serie_0 ?? {})
}

async function fetchAttackSummary(dimension, geo) {
  const result = await radarGet(`/radar/attacks/layer7/summary/${dimension}`, {
    dateRange: DATE_RANGE,
    ...geo,
  })
  return toShareMap(result.summary_0 ?? {})
}

async function fetchL3Summary(dimension, geo) {
  const result = await radarGet(`/radar/attacks/layer3/summary/${dimension}`, {
    dateRange: DATE_RANGE,
    direction: 'TARGET',
    ...geo,
  })
  return toShareMap(result.summary_0 ?? {})
}

async function fetchL3Trend(geo) {
  const result = await radarGet('/radar/attacks/layer3/timeseries', {
    dateRange: DATE_RANGE,
    aggInterval: '1d',
    direction: 'TARGET',
    ...geo,
  })
  return extractSerie(result)
}

async function fetchDnsTrend(geo) {
  const result = await radarGet('/radar/dns/timeseries', {
    dateRange: DATE_RANGE,
    aggInterval: '1d',
    name: 'dns',
    ...geo,
  })
  return extractSerie(result)
}

async function fetchDnsSummary(dimension, geo) {
  const result = await radarGet(`/radar/dns/summary/${dimension}`, {
    dateRange: DATE_RANGE,
    ...geo,
  })
  return toShareMap(result.summary_0 ?? {})
}

async function fetchBgpTrend(geo) {
  const result = await radarGet('/radar/bgp/timeseries', {
    dateRange: DATE_RANGE,
    aggInterval: '1d',
    name: 'bgp',
    ...geo,
  })
  return extractSerie(result)
}

async function fetchEmailSummary(dimension) {
  // Email security metrics are global (no location filter)
  const result = await radarGet(`/radar/email/security/summary/${dimension}`, {
    dateRange: DATE_RANGE,
  })
  return toShareMap(result.summary_0 ?? {})
}

async function fetchEmailBundle() {
  const [spam, malicious, spoof, threatCategory, arc, dkim, dmarc, spf] =
    await Promise.all([
      soft('email.spam', () => fetchEmailSummary('SPAM'), {}),
      soft('email.malicious', () => fetchEmailSummary('MALICIOUS'), {}),
      soft('email.spoof', () => fetchEmailSummary('SPOOF'), {}),
      soft('email.threat', () => fetchEmailSummary('THREAT_CATEGORY'), {}),
      soft('email.arc', () => fetchEmailSummary('ARC'), {}),
      soft('email.dkim', () => fetchEmailSummary('DKIM'), {}),
      soft('email.dmarc', () => fetchEmailSummary('DMARC'), {}),
      soft('email.spf', () => fetchEmailSummary('SPF'), {}),
    ])
  return { spam, malicious, spoof, threatCategory, arc, dkim, dmarc, spf }
}

function mapBgpHijack(item, asnInfo = []) {
  const asnMap = Object.fromEntries(
    (asnInfo ?? []).map((a) => [a.asn, a]),
  )
  const hijacker = asnMap[item.hijacker_asn]
  return {
    id: `hijack-${item.id}`,
    kind: 'bgp_hijack',
    eventType: 'BGP_HIJACK',
    description: `疑似劫持 AS${item.hijacker_asn}${
      hijacker?.org_name ? ` (${hijacker.org_name})` : ''
    }`,
    startDate: item.min_hijack_ts ?? null,
    endDate: item.max_hijack_ts ?? null,
    locations: [
      ...(item.hijacker_country ? [item.hijacker_country] : []),
      ...(item.victim_countries ?? []),
    ]
      .filter(Boolean)
      .map((c) => String(c).toUpperCase()),
    locationNames: [],
    outageCause: null,
    outageType: `confidence:${item.confidence_score ?? '?'}`,
    scope: (item.prefixes ?? []).slice(0, 3).join(', ') || null,
    linkedUrl: null,
    status: item.is_stale ? 'STALE' : 'ACTIVE',
  }
}

function mapBgpLeak(item, asnInfo = []) {
  const asnMap = Object.fromEntries(
    (asnInfo ?? []).map((a) => [a.asn, a]),
  )
  const leak = asnMap[item.leak_asn]
  return {
    id: `leak-${item.id}`,
    kind: 'bgp_leak',
    eventType: 'BGP_LEAK',
    description: `路由泄漏 AS${item.leak_asn}${
      leak?.org_name ? ` (${leak.org_name})` : ''
    }`,
    startDate: item.min_ts ?? item.detected_ts ?? null,
    endDate: item.max_ts ?? null,
    locations: (item.countries ?? [])
      .filter(Boolean)
      .map((c) => String(c).toUpperCase()),
    locationNames: [],
    outageCause: null,
    outageType: `type:${item.leak_type ?? '?'}`,
    scope: `prefixes:${item.prefix_count ?? 0}`,
    linkedUrl: null,
    status: item.finished ? 'FINISHED' : 'ONGOING',
  }
}

async function fetchIqiMetric(metric, geo) {
  const result = await radarGet('/radar/quality/iqi/summary', {
    metric,
    dateRange: DATE_RANGE,
    ...geo,
  })
  const summary = result.summary_0 ?? {}
  return {
    p25: Number(summary.p25) || 0,
    p50: Number(summary.p50) || 0,
    p75: Number(summary.p75) || 0,
  }
}

async function fetchIqi(geo) {
  // IQI requires a mandatory `metric` query param per request
  const [bandwidth, latency, dns] = await Promise.all([
    fetchIqiMetric('BANDWIDTH', geo),
    fetchIqiMetric('LATENCY', geo),
    fetchIqiMetric('DNS', geo),
  ])
  return { bandwidth, latency, dns }
}

async function fetchGlobalIntel() {
  const [outagesRaw, anomaliesRaw, hijacksRaw, leaksRaw, email, bgpTrend] =
    await Promise.all([
      soft(
        'outages',
        () =>
          radarGet('/radar/annotations/outages', {
            dateRange: DATE_RANGE,
            limit: EVENT_LIMIT,
          }),
        { annotations: [] },
      ),
      soft(
        'anomalies',
        () =>
          radarGet('/radar/traffic_anomalies', {
            dateRange: DATE_RANGE,
            limit: EVENT_LIMIT,
          }),
        { trafficAnomalies: [] },
      ),
      soft(
        'bgp.hijacks',
        () =>
          radarGet('/radar/bgp/hijacks/events', {
            dateRange: DATE_RANGE,
            per_page: 20,
            sortBy: 'TIME',
            sortOrder: 'DESC',
          }),
        { events: [], asn_info: [] },
      ),
      soft(
        'bgp.leaks',
        () =>
          radarGet('/radar/bgp/leaks/events', {
            dateRange: DATE_RANGE,
            per_page: 20,
            sortBy: 'TIME',
            sortOrder: 'DESC',
          }),
        { events: [], asn_info: [] },
      ),
      soft('email', () => fetchEmailBundle(), emptyEmail()),
      soft('bgp.trend.global', () => fetchBgpTrend({}), emptyTrend()),
    ])

  const outages = (outagesRaw.annotations ?? []).map(mapOutage)
  const anomalies = (anomaliesRaw.trafficAnomalies ?? []).map(mapAnomaly)
  const bgpHijacks = (hijacksRaw.events ?? []).map((e) =>
    mapBgpHijack(e, hijacksRaw.asn_info),
  )
  const bgpLeaks = (leaksRaw.events ?? []).map((e) =>
    mapBgpLeak(e, leaksRaw.asn_info),
  )
  const events = [...outages, ...anomalies, ...bgpHijacks, ...bgpLeaks].sort(
    (a, b) => String(b.startDate).localeCompare(String(a.startDate)),
  )

  return {
    fetchedAt: new Date().toISOString(),
    outages,
    anomalies,
    bgpHijacks,
    bgpLeaks,
    bgpTrend,
    email,
    events,
  }
}

async function fetchRegionBundle(region, geo, ranking, intel) {
  const fetchedAt = new Date().toISOString()
  const [
    deviceType,
    os,
    browserFamily,
    botClass,
    aiBots,
    httpTrend,
    netflowTrend,
    attackIndustry,
    attackMitigation,
    iqi,
    dnsTrend,
    dnsQueryType,
    dnsProtocol,
    l3Protocol,
    l3Vector,
    l3Industry,
    l3Trend,
    bgpTrend,
  ] = await Promise.all([
    soft('device_type', () => fetchHttpSummary('device_type', geo), {}),
    soft('os', () => fetchHttpSummary('os', geo), {}),
    soft('browser_family', () => fetchHttpSummary('browser_family', geo), {}),
    soft('bot_class', () => fetchHttpSummary('bot_class', geo), {}),
    soft('aiBots', () => fetchAiBots(geo), {}),
    soft('httpTrend', () => fetchHttpTrend(geo), emptyTrend()),
    soft('netflowTrend', () => fetchNetflowTrend(geo), emptyTrend()),
    soft('attackIndustry', () => fetchAttackSummary('INDUSTRY', geo), {}),
    soft(
      'attackMitigation',
      () => fetchAttackSummary('MITIGATION_PRODUCT', geo),
      {},
    ),
    soft('iqi', () => fetchIqi(geo), emptyIqi()),
    soft('dnsTrend', () => fetchDnsTrend(geo), emptyTrend()),
    soft('dnsQueryType', () => fetchDnsSummary('QUERY_TYPE', geo), {}),
    soft('dnsProtocol', () => fetchDnsSummary('PROTOCOL', geo), {}),
    soft('l3Protocol', () => fetchL3Summary('PROTOCOL', geo), {}),
    soft('l3Vector', () => fetchL3Summary('VECTOR', geo), {}),
    soft('l3Industry', () => fetchL3Summary('INDUSTRY', geo), {}),
    soft('l3Trend', () => fetchL3Trend(geo), emptyTrend()),
    soft('bgpTrend', () => fetchBgpTrend(geo), emptyTrend()),
  ])

  const events = (intel.events ?? []).filter((e) => matchesRegion(e, region))
  const bgpHijacks = (intel.bgpHijacks ?? []).filter((e) =>
    matchesRegion(e, region),
  )
  const bgpLeaks = (intel.bgpLeaks ?? []).filter((e) => matchesRegion(e, region))

  const base = {
    region,
    fetchedAt,
    deviceType,
    os,
    browserFamily,
    botClass,
    aiBots,
    httpTrend,
    netflowTrend,
    attackIndustry,
    attackMitigation,
    iqi,
    dnsTrend,
    dnsQueryType,
    dnsProtocol,
    l3Protocol,
    l3Vector,
    l3Industry,
    l3Trend,
    bgpTrend,
    bgpHijacks,
    bgpLeaks,
    email: intel.email ?? emptyEmail(),
    events,
  }

  if (ranking.mode === 'single') {
    return {
      ...base,
      topDomains: await soft(
        `ranking:${ranking.location}`,
        () => fetchTopDomains(ranking.location),
        [],
      ),
    }
  }

  const countries = ranking.countries
  const pairs = await Promise.all(
    countries.map(async (code) => [
      code.toLowerCase(),
      await soft(`ranking:${code}`, () => fetchTopDomains(code), []),
    ]),
  )
  return {
    ...base,
    topDomains: [],
    topDomainsByCountry: Object.fromEntries(pairs),
  }
}

async function safeRegion(label, fn) {
  try {
    return await fn()
  } catch (err) {
    const message = `${label}: ${err.message}`
    errors.push(message)
    console.error(message)
    return null
  }
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const fetchedAt = new Date().toISOString()

  const intel = await fetchGlobalIntel()
  await writeFile(
    path.join(outDir, 'intel.json'),
    `${JSON.stringify(intel, null, 2)}\n`,
    'utf8',
  )
  console.log(
    `Wrote intel.json (${intel.outages.length} outages, ${intel.anomalies.length} anomalies, ${intel.bgpHijacks.length} hijacks, ${intel.bgpLeaks.length} leaks)`,
  )

  const cn = await safeRegion('cn', () =>
    fetchRegionBundle(
      'cn',
      { location: 'CN' },
      { mode: 'single', location: 'CN' },
      intel,
    ),
  )
  const us = await safeRegion('us', () =>
    fetchRegionBundle(
      'us',
      { location: 'US' },
      { mode: 'single', location: 'US' },
      intel,
    ),
  )
  const eu = await safeRegion('eu', () =>
    fetchRegionBundle(
      'eu',
      { continent: 'EU' },
      { mode: 'multi', countries: ['DE', 'FR', 'GB'] },
      intel,
    ),
  )

  const regions = []
  for (const [id, data] of [
    ['cn', cn],
    ['us', us],
    ['eu', eu],
  ]) {
    if (!data) continue
    regions.push(id)
    await writeFile(
      path.join(outDir, `${id}.json`),
      `${JSON.stringify(data, null, 2)}\n`,
      'utf8',
    )
    console.log(`Wrote ${id}.json`)
  }

  if (regions.length === 0) {
    console.error('No region data written. Aborting.')
    process.exit(1)
  }

  const meta = {
    fetchedAt,
    source: 'radar',
    regions,
    errors,
  }
  await writeFile(
    path.join(outDir, 'meta.json'),
    `${JSON.stringify(meta, null, 2)}\n`,
    'utf8',
  )
  console.log('Wrote meta.json')
  if (errors.length) {
    console.warn(`Completed with ${errors.length} warning(s).`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
