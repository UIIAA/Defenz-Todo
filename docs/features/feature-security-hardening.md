# Feature: Security Hardening
**Status:** Done
**Priority:** P0
**Date:** 2026-04-25

## Objective
Aplicar protecoes basicas OWASP no Defenz To-Do.

## Implemented
1. Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
2. Rate limiting in-memory: login 5/min, register 3/hr, invite validate 10/min
3. Password policy: min 8 chars, 1 maiuscula, 1 minuscula, 1 numero, 1 especial
4. CORS wildcard removido do register
5. NEXTAUTH_SECRET validado no startup (fail-fast se vazio ou < 32 chars)
6. CRON_SECRET com timing-safe comparison
7. Zod validation no register (substituiu validacao manual)
8. Zod validation no profile update
9. Mensagens de erro genericas no auth (anti user-enumeration)
10. bcrypt cost bumped 10 -> 12

## Tests
13 novos testes (password policy + rate limiting). 311 total passando.
