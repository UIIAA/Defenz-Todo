import { useEffect, useRef, useCallback } from 'react'

export interface UsePollingOptions {
  /** Funcao chamada a cada ciclo de polling */
  fetchFn: () => Promise<void>
  /** Intervalo em ms (default: 5000) */
  intervalMs?: number
}

export interface UsePollingReturn {
  /** Forca fetch imediato e reseta timer */
  refresh: () => void
}

export function usePolling({ fetchFn, intervalMs = 5000 }: UsePollingOptions): UsePollingReturn {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    intervalRef.current = setInterval(() => {
      fetchFnRef.current()
    }, intervalMs)
  }, [intervalMs, clearTimer])

  const refresh = useCallback(() => {
    fetchFnRef.current()
    startTimer()
  }, [startTimer])

  useEffect(() => {
    // Fetch immediately on mount
    fetchFnRef.current()
    startTimer()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearTimer()
      } else {
        fetchFnRef.current()
        startTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startTimer, clearTimer])

  return { refresh }
}
