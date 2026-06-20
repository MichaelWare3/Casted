// Tracks every character a viewer has been cast as. Backed by a shared in-memory
// store + localStorage so it can be subscribed to (for cloud sync) and stays in
// sync across hook instances in the tab.

const STORAGE_KEY = 'casted_ego_history_v1'

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

let store: string[] = read()
const listeners = new Set<(value: string[]) => void>()

function emit() {
  for (const listener of listeners) listener(store)
}

function persist(ids: string[]) {
  store = ids
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* storage unavailable — keep in-memory */
  }
  emit()
}

export function readCastHistory(): string[] {
  return store
}

export function addToCastHistory(id: string): void {
  if (store.includes(id)) return
  persist([...store, id])
}

export function resetCastHistory(): void {
  persist([])
}

// Cloud-sync helpers.
export function getCastHistorySnapshot(): string[] {
  return store
}
export function replaceCastHistory(ids: string[]): void {
  persist(ids)
}
export function subscribeCastHistory(cb: (value: string[]) => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
