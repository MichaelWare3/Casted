// Tracks every character a viewer has been cast as, so the engine never repeats
// until the whole pool is exhausted (then it resets and starts fresh).

const STORAGE_KEY = 'casted_ego_history_v1'

export function readCastHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function addToCastHistory(id: string): void {
  try {
    const current = readCastHistory()
    if (current.includes(id)) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]))
  } catch {
    /* storage unavailable — anti-repeat just won't persist this session */
  }
}

export function resetCastHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
