'use client'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-muted-foreground mb-4 [&>svg]:h-12 [&>svg]:w-12">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        {description}
      </p>
      <div className="flex gap-3">
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700 text-white">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
