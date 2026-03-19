'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import { STATUSES } from '@/app/dashboard/demandas/helpers'
import type { WipLimits } from '@/hooks/use-wip-limits'

export function WipSettingsPopover({
  limits,
  onSetLimit,
  userLimits,
  onSetUserLimit,
  assignees,
}: {
  limits: WipLimits
  onSetLimit: (statusId: string, limit: number) => void
  userLimits?: WipLimits
  onSetUserLimit?: (userName: string, limit: number) => void
  assignees?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'column' | 'user'>('column')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const hasUserSection = onSetUserLimit && assignees && assignees.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title="Limites WIP"
      >
        <Settings2 className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 w-60">
          {hasUserSection && (
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setTab('column')}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1 rounded transition-colors cursor-pointer ${
                  tab === 'column'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Por Coluna
              </button>
              <button
                onClick={() => setTab('user')}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1 rounded transition-colors cursor-pointer ${
                  tab === 'user'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Por Usuario
              </button>
            </div>
          )}

          {tab === 'column' && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Limites WIP por coluna
              </p>
              <div className="space-y-2">
                {STATUSES.filter((s) => s.id !== 'bloqueada').map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {s.icon} {s.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={limits[s.id] || ''}
                      onChange={(e) => onSetLimit(s.id, parseInt(e.target.value) || 0)}
                      placeholder="--"
                      className="w-14 text-center text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'user' && hasUserSection && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Limites WIP por usuario
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assignees.map((name) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {name}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={userLimits?.[name] || ''}
                      onChange={(e) => onSetUserLimit(name, parseInt(e.target.value) || 0)}
                      placeholder="--"
                      className="w-14 text-center text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-[10px] text-slate-400 mt-2">
            0 ou vazio = sem limite
          </p>
        </div>
      )}
    </div>
  )
}
