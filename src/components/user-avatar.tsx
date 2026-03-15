'use client'

import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
]

const SIZE_MAP = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
} as const

const TEXT_SIZE_MAP = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (parts[0][0] || '?').toUpperCase()
}

function hashName(name: string | null | undefined): number {
  const str = name || ''
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % COLORS.length
}

export function UserAvatar({ name, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(name)
  const colorClass = COLORS[hashName(name)]

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold',
        SIZE_MAP[size],
        TEXT_SIZE_MAP[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  )
}
