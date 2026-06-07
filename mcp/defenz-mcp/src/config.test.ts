import { describe, it, expect } from 'vitest'
import { loadConfig } from './config.js'

const VALID_TOKEN = 'defz_' + 'a'.repeat(56)

describe('loadConfig', () => {
  it('parses a valid environment', () => {
    const cfg = loadConfig({
      DEFENZ_API_URL: 'https://defenz-todo.vercel.app',
      DEFENZ_API_TOKEN: VALID_TOKEN,
    })
    expect(cfg.baseUrl).toBe('https://defenz-todo.vercel.app')
    expect(cfg.token).toBe(VALID_TOKEN)
    expect(cfg.timeoutMs).toBe(30000)
  })

  it('throws a clear error when DEFENZ_API_URL is missing', () => {
    expect(() => loadConfig({ DEFENZ_API_TOKEN: VALID_TOKEN })).toThrowError(/DEFENZ_API_URL/)
  })

  it('throws a clear error when DEFENZ_API_TOKEN is missing', () => {
    expect(() =>
      loadConfig({ DEFENZ_API_URL: 'https://x.app' })
    ).toThrowError(/DEFENZ_API_TOKEN/)
  })

  it('rejects a token that does not match the defz_ format', () => {
    expect(() =>
      loadConfig({ DEFENZ_API_URL: 'https://x.app', DEFENZ_API_TOKEN: 'not-a-token' })
    ).toThrowError(/defz_/)
  })

  it('parses a custom timeout', () => {
    const cfg = loadConfig({
      DEFENZ_API_URL: 'https://x.app',
      DEFENZ_API_TOKEN: VALID_TOKEN,
      DEFENZ_API_TIMEOUT_MS: '5000',
    })
    expect(cfg.timeoutMs).toBe(5000)
  })

  it('ignores an invalid timeout and falls back to the default', () => {
    const cfg = loadConfig({
      DEFENZ_API_URL: 'https://x.app',
      DEFENZ_API_TOKEN: VALID_TOKEN,
      DEFENZ_API_TIMEOUT_MS: 'abc',
    })
    expect(cfg.timeoutMs).toBe(30000)
  })
})
