// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { ServiceWorkerRegister } from '../sw-register'

describe('ServiceWorkerRegister', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        register: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env.NODE_ENV = originalEnv
  })

  it('registra service worker em producao', () => {
    process.env.NODE_ENV = 'production'
    render(<ServiceWorkerRegister />)
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
  })

  it('nao registra service worker em desenvolvimento', () => {
    process.env.NODE_ENV = 'development'
    render(<ServiceWorkerRegister />)
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled()
  })

  it('lida com erro de registro gracefully', () => {
    process.env.NODE_ENV = 'production'
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        register: vi.fn().mockRejectedValue(new Error('SW error')),
      },
    })
    render(<ServiceWorkerRegister />)
    // Should not throw
    consoleSpy.mockRestore()
  })
})
