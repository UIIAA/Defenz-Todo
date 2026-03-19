'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'defenz-wip-limits'
const USER_STORAGE_KEY = 'defenz-wip-limits-user'

export type WipLimits = Record<string, number>

export function useWipLimits() {
  const [limits, setLimits] = useState<WipLimits>({})
  const [userLimits, setUserLimits] = useState<WipLimits>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setLimits(JSON.parse(stored))
      }
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (storedUser) {
        setUserLimits(JSON.parse(storedUser))
      }
    } catch {
      // SSR or invalid JSON
    }
  }, [])

  const setLimit = useCallback((statusId: string, limit: number) => {
    setLimits((prev) => {
      const next = { ...prev }
      if (limit <= 0) {
        delete next[statusId]
      } else {
        next[statusId] = limit
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // quota exceeded
      }
      return next
    })
  }, [])

  const getLimit = useCallback((statusId: string): number | undefined => {
    return limits[statusId] || undefined
  }, [limits])

  const setUserLimit = useCallback((userName: string, limit: number) => {
    setUserLimits((prev) => {
      const next = { ...prev }
      if (limit <= 0) {
        delete next[userName]
      } else {
        next[userName] = limit
      }
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // quota exceeded
      }
      return next
    })
  }, [])

  const getUserLimit = useCallback((userName: string): number | undefined => {
    return userLimits[userName] || undefined
  }, [userLimits])

  return { limits, setLimit, getLimit, userLimits, setUserLimit, getUserLimit }
}
