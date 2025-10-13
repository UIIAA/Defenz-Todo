'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Shield, BarChart3, Users, Target, Calendar, LogOut, Menu, X, Download, Settings } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const handleImportData = async () => {
    try {
      const response = await fetch('/api/activities/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Dados importados com sucesso! ${result.count} atividades carregadas.`)
        window.location.reload()
      } else {
        alert('Erro ao importar dados. Tente novamente.')
      }
    } catch (error) {
      console.error('Error importing data:', error)
      alert('Erro ao importar dados. Tente novamente.')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-300">Carregando...</div>
    </div>
  }

  if (!session) {
    return null
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 bg-slate-900/50 border-r border-slate-800/50 min-h-screen`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                {sidebarOpen && (
                  <h1 className="text-xl font-bold text-slate-100">Defenz</h1>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <a
                href="/dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                {sidebarOpen && <span>Dashboard</span>}
              </a>
              <a
                href="/dashboard/activities"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/dashboard/activities')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Target className="h-5 w-5" />
                {sidebarOpen && <span>Atividades</span>}
              </a>
              <a
                href="/dashboard/analytics"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/dashboard/analytics')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                {sidebarOpen && <span>Análises</span>}
              </a>
              <a
                href="/dashboard/calendar"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/dashboard/calendar')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Calendar className="h-5 w-5" />
                {sidebarOpen && <span>Calendário</span>}
              </a>
              <a
                href="/dashboard/settings/notifications"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/dashboard/settings/notifications')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                {sidebarOpen && <span>Notificações</span>}
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-900/30 border-b border-slate-800/50 backdrop-blur-sm">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 hidden sm:block">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
