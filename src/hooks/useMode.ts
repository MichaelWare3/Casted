import { useEffect, useState } from 'react'

export type Mode = 'just-watch' | 'film-head'

const STORAGE_KEY = 'casted_mode_v1'

function readMode(): Mode {
  if (typeof window === 'undefined') return 'just-watch'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'film-head' ? 'film-head' : 'just-watch'
  } catch {
    return 'just-watch'
  }
}

// Shared store so every useMode() instance in the tab stays in sync live,
// not just across tabs via the `storage` event.
let modeStore: Mode = readMode()
const listeners = new Set<(mode: Mode) => void>()

function emit() {
  for (const listener of listeners) listener(modeStore)
}

export function useMode() {
  const [mode, setModeState] = useState<Mode>(modeStore)

  useEffect(() => {
    const onChange = (next: Mode) => setModeState(next)
    listeners.add(onChange)
    setModeState(modeStore)

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        modeStore = readMode()
        emit()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setMode = (next: Mode) => {
    modeStore = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage failures — keep in-memory mode
    }
    emit()
  }

  const toggle = () => setMode(modeStore === 'just-watch' ? 'film-head' : 'just-watch')

  return { mode, setMode, toggle }
}
