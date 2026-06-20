import { supabase } from './supabase'
import { getTheaterSnapshot, replaceTheater } from '../hooks/useTheater'
import { getCastHistorySnapshot, replaceCastHistory } from './castHistory'
import type { TheaterMovie } from '../types'

const TABLE = 'casted_profiles'

function ts(m: TheaterMovie): number {
  return Math.max(m.watched_at ?? 0, m.added_at ?? 0)
}

/** Union by movie id, preferring the entry with the most recent activity. */
function mergeTheater(a: TheaterMovie[], b: TheaterMovie[]): TheaterMovie[] {
  const map = new Map<number, TheaterMovie>()
  for (const m of [...a, ...b]) {
    const cur = map.get(m.id)
    if (!cur) {
      map.set(m.id, m)
      continue
    }
    map.set(m.id, ts(m) >= ts(cur) ? { ...cur, ...m } : { ...m, ...cur })
  }
  return [...map.values()]
}

/** Union of ids, preserving order, de-duplicated. */
function mergeHistory(a: string[], b: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of [...a, ...b]) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

async function push(userId: string): Promise<void> {
  if (!supabase) return
  await supabase.from(TABLE).upsert({
    id: userId,
    theater: getTheaterSnapshot(),
    cast_history: getCastHistorySnapshot(),
    updated_at: new Date().toISOString(),
  })
}

/** On sign-in: pull the cloud row, merge with local, apply to both. */
export async function pullAndMerge(userId: string): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase
    .from(TABLE)
    .select('theater, cast_history')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.warn('[CASTED] cloud pull failed', error.message)
    return
  }
  const cloudTheater = (data?.theater as TheaterMovie[] | undefined) ?? []
  const cloudHistory = (data?.cast_history as string[] | undefined) ?? []

  replaceTheater(mergeTheater(getTheaterSnapshot(), cloudTheater))
  replaceCastHistory(mergeHistory(getCastHistorySnapshot(), cloudHistory))
  await push(userId)
}

let timer: ReturnType<typeof setTimeout> | null = null

/** Debounced push of local state to the cloud. */
export function pushToCloud(userId: string): void {
  if (!supabase) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    push(userId).catch((err) => console.warn('[CASTED] cloud push failed', err))
  }, 1200)
}
