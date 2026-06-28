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
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    })
    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
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

  it('em desenvolvimento, desregistra SW legado e limpa caches (anti-stale)', async () => {
    process.env.NODE_ENV = 'development'
    const unregister = vi.fn().mockResolvedValue(true)
    navigator.serviceWorker.getRegistrations = vi.fn().mockResolvedValue([{ unregister }])
    ;(globalThis as { caches: { keys: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> } }).caches.keys =
      vi.fn().mockResolvedValue(['defenz-v1'])

    render(<ServiceWorkerRegister />)

    await vi.waitFor(() => expect(unregister).toHaveBeenCalled())
    expect(caches.delete).toHaveBeenCalledWith('defenz-v1')
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

  it('nao registra SW na rota publica /abrir-ticket (portal)', () => {
    process.env.NODE_ENV = 'production'
    // Simula pathname do portal
    vi.stubGlobal('location', { ...window.location, pathname: '/abrir-ticket' })
    render(<ServiceWorkerRegister />)
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled()
  })
})
