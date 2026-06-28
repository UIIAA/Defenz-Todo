'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Pagina publica de portal: nao registrar SW (evita que o app-shell cacheado
    // controle a rota publica e cause comportamentos inesperados em modo offline)
    if (window.location.pathname.startsWith('/abrir-ticket')) return

    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err)
      })
      return
    }

    // DEV: garante que NENHUM Service Worker (de um build de prod anterior) sirva o app
    // shell/JS cacheado — causa raiz de "menu some/aparece" intermitente em localhost.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {})
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {})
    }
  }, [])

  return null
}
