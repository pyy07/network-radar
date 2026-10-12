import type { IntelData, MetaData, RegionData, RegionId } from '../types'

const dataBase = `${import.meta.env.BASE_URL}data`

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function loadMeta(): Promise<MetaData> {
  return fetchJson<MetaData>(`${dataBase}/meta.json`)
}

export async function loadRegion(region: RegionId): Promise<RegionData> {
  return fetchJson<RegionData>(`${dataBase}/${region}.json`)
}

export async function loadIntel(): Promise<IntelData | null> {
  try {
    return await fetchJson<IntelData>(`${dataBase}/intel.json`)
  } catch {
    return null
  }
}

export async function loadAllRegions(
  regions: RegionId[],
): Promise<Record<RegionId, RegionData>> {
  const entries = await Promise.all(
    regions.map(async (region) => [region, await loadRegion(region)] as const),
  )
  return Object.fromEntries(entries) as Record<RegionId, RegionData>
}
