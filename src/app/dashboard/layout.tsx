'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Shield, BarChart3, LogOut, Menu, ClipboardList, ChevronDown, LayoutGrid } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [demandasOpen, setDemandasOpen] = useState(true)
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
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800/50 min-h-screen`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-red-600 to-red-500 rounded-lg shadow-lg shadow-red-900/20">
                  <Shield className="h-6 w-6 text-white fill-white" />
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">DEFENZ</h1>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Demandas Dropdown */}
              <div className="space-y-1">
                <button
                  onClick={() => setDemandasOpen(!demandasOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5" />
                    {sidebarOpen && <span>Demandas</span>}
                  </div>
                  {sidebarOpen && (
                    <ChevronDown className={`h-4 w-4 transition-transform ${demandasOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {demandasOpen && sidebarOpen && (
                  <div className="pl-4 space-y-1">
                    <a
                      href="/dashboard/demandas"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${isActive('/dashboard/demandas')
                        ? 'bg-red-50 dark:bg-red-600/10 text-red-600 dark:text-red-500 font-medium'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>Kanban</span>
                    </a>
                    <a
                      href="/dashboard/demandas/analises"
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${isActive('/dashboard/demandas/analises')
                        ? 'bg-red-50 dark:bg-red-600/10 text-red-600 dark:text-red-500 font-medium'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analises</span>
                    </a>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/80 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800/50 backdrop-blur-sm transition-colors">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
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
