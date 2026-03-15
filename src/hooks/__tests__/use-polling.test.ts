// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePolling } from '../use-polling'

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls fetchFn immediately on mount', () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    renderHook(() => usePolling({ fetchFn, intervalMs: 5000 }))

    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('calls fetchFn repeatedly at intervalMs', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    renderHook(() => usePolling({ fetchFn, intervalMs: 5000 }))

    expect(fetchFn).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(fetchFn).toHaveBeenCalledTimes(2)

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('stops polling on unmount (cleanup)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    const { unmount } = renderHook(() =>
      usePolling({ fetchFn, intervalMs: 5000 })
    )

    expect(fetchFn).toHaveBeenCalledTimes(1)

    unmount()

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    // Should not have been called again after unmount
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('stops polling when document becomes hidden', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    renderHook(() => usePolling({ fetchFn, intervalMs: 5000 }))

    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Simulate tab going to background
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    // Should not have polled while hidden
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Cleanup
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    })
  })

  it('resumes polling when document becomes visible again', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    renderHook(() => usePolling({ fetchFn, intervalMs: 5000 }))

    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Go to background
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Come back to foreground
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    // Should fetch immediately on becoming visible
    expect(fetchFn).toHaveBeenCalledTimes(2)

    // And resume interval
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('refresh() calls fetchFn immediately and resets timer', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      usePolling({ fetchFn, intervalMs: 5000 })
    )

    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Advance 3s (not yet at 5s interval)
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Call refresh
    act(() => {
      result.current.refresh()
    })
    expect(fetchFn).toHaveBeenCalledTimes(2)

    // Timer should be reset — 5s from refresh, not from original start
    await act(async () => {
      vi.advanceTimersByTime(4999)
    })
    expect(fetchFn).toHaveBeenCalledTimes(2)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })
})
