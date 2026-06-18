import { useCallback, useState } from 'react'
import { castAlterEgo, type CastSelection } from '../lib/casting'
import type { AlterEgoCharacter } from '../types'

interface UseClaudeState {
  character: AlterEgoCharacter | null
  loading: boolean
  error: string | null
}

export function useClaude() {
  const [state, setState] = useState<UseClaudeState>({
    character: null,
    loading: false,
    error: null,
  })

  const generateAlterEgo = useCallback(async (selections: CastSelection[], tasteBlock = '') => {
    setState({ character: null, loading: true, error: null })
    try {
      const character = await castAlterEgo(selections, tasteBlock)

      setState({ character, loading: false, error: null })
      return character
    } catch (err) {
      console.error('[CASTED] ❌ useClaude error:', err)
      const message = err instanceof Error ? err.message : 'The reel snapped.'
      setState({ character: null, loading: false, error: message })
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState({ character: null, loading: false, error: null })
  }, [])

  return { ...state, generateAlterEgo, reset }
}
