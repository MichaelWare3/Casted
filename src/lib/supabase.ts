import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Public, client-safe keys. The app works fully local-only when these aren't
// set — cloud sync simply stays disabled until they're configured.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseEnabled = !!(url && key)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, key as string)
  : null
