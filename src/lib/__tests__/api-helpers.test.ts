import { describe, it, expect } from 'vitest'
import { ZodError, z } from 'zod'
import { ApiError, handleApiError, successResponse, createdResponse } from '../api-helpers'

describe('ApiError', () => {
  it('sets message, statusCode and details', () => {
    const err = new ApiError('Not found', 404, { id: '123' })
    expect(err.message).toBe('Not found')
    expect(err.statusCode).toBe(404)
    expect(err.details).toEqual({ id: '123' })
    expect(err).toBeInstanceOf(Error)
  })
})

describe('handleApiError', () => {
  it('handles ApiError with correct status', async () => {
    const res = handleApiError(new ApiError('Forbidden', 403))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ success: false, error: 'Forbidden' })
  })

  it('handles ZodError as 400 with formatted details', async () => {
    const schema = z.object({ name: z.string().min(1) })
    let zodErr: ZodError | undefined
    try {
      schema.parse({ name: '' })
    } catch (e) {
      zodErr = e as ZodError
    }
    const res = handleApiError(zodErr!)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Dados inválidos')
    expect(body.details).toBeInstanceOf(Array)
    expect(body.details[0]).toHaveProperty('field')
    expect(body.details[0]).toHaveProperty('message')
  })

  it('handles Prisma P2002 as 409', async () => {
    const res = handleApiError({ code: 'P2002', meta: { target: ['email'] } })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('Registro duplicado')
  })

  it('handles Prisma P2025 as 404', async () => {
    const res = handleApiError({ code: 'P2025' })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Recurso não encontrado')
  })

  it('handles Prisma P2003 as 400', async () => {
    const res = handleApiError({ code: 'P2003', meta: {} })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Referência inválida')
  })

  it('handles unknown Prisma code as 500', async () => {
    const res = handleApiError({ code: 'P9999' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Erro de banco de dados')
  })

  it('handles generic Error as 500', async () => {
    const res = handleApiError(new Error('boom'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('boom')
  })

  it('handles non-Error object as 500', async () => {
    const res = handleApiError('string error')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Erro interno do servidor')
  })
})

describe('successResponse', () => {
  it('returns success: true with data', async () => {
    const res = successResponse({ id: 1 })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, data: { id: 1 } })
  })

  it('includes message when provided', async () => {
    const res = successResponse({ id: 1 }, 'Created')
    const body = await res.json()
    expect(body.message).toBe('Created')
  })
})

describe('createdResponse', () => {
  it('returns status 201', async () => {
    const res = createdResponse({ id: 1 })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
