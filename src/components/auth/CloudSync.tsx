import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { pullAndMerge, pushToCloud } from '../../lib/cloudSync'
import { subscribeTheater } from '../../hooks/useTheater'
import { subscribeCastHistory } from '../../lib/castHistory'

/**
 * Invisible component: when a user is signed in, it merges their cloud data with
 * local on sign-in and pushes local changes (theater diary + cast history) up.
 * No-ops entirely when Supabase isn't configured.
 */
export default function CloudSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let active = true
    pullAndMerge(user.id).catch(() => {})

    const unsubTheater = subscribeTheater(() => {
      if (active) pushToCloud(user.id)
    })
    const unsubHistory = subscribeCastHistory(() => {
      if (active) pushToCloud(user.id)
    })

    return () => {
      active = false
      unsubTheater()
      unsubHistory()
    }
  }, [user])

  return null
}
