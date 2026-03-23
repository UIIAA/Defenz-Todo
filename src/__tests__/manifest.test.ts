import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('manifest.json', () => {
  const manifestPath = path.resolve(__dirname, '../../public/manifest.json')

  it('existe e é JSON valido', () => {
    expect(fs.existsSync(manifestPath)).toBe(true)
    const content = fs.readFileSync(manifestPath, 'utf-8')
    expect(() => JSON.parse(content)).not.toThrow()
  })

  it('tem name, short_name, start_url, display, icons', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBeTruthy()
    expect(manifest.icons).toBeDefined()
    expect(Array.isArray(manifest.icons)).toBe(true)
  })

  it('tem icones 192x192 e 512x512', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  it('display é standalone', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    expect(manifest.display).toBe('standalone')
  })
})
