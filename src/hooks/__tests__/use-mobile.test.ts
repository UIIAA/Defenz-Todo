// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

describe('useIsMobile', () => {
  let listeners: Array<() => void> = []
  let mockMatches = false

  beforeEach(() => {
    listeners = []
    mockMatches = false

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: mockMatches,
      media: query,
      addEventListener: (_: string, cb: () => void) => {
        listeners.push(cb)
      },
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    listeners = []
  })

  it('retorna true quando width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('retorna false quando width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('responde a mudanca de media query', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })
      listeners.forEach((cb) => cb())
    })

    expect(result.current).toBe(true)
  })
})
