'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { BarChart3, LogOut, Menu, ClipboardList, ChevronDown, LayoutGrid, FileText } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { DefenzLogoIcon } from '@/components/defenz-logo'

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

  const userRole = (session?.user as { role?: string })?.role || ''
  const isAdmin = ['admin', 'gerencia'].includes(userRole)

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
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-muted-foreground font-medium">Carregando...</span>
      </div>
    </div>
  }

  if (!session) {
    return null
  }

  const isActive = (path: string) => pathname === path

  const navItemClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer ${
      isActive(path)
        ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 font-semibold shadow-sm shadow-blue-500/5'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
    }`

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#0a1628] transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 bg-white dark:bg-[#0d1929] border-r border-slate-200/80 dark:border-blue-900/20 min-h-screen`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200/80 dark:border-blue-900/20">
              <div className="flex items-center gap-3">
                <DefenzLogoIcon size={36} className="text-blue-600 dark:text-blue-400 shrink-0" />
                {sidebarOpen && (
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    DEFENZ<span className="text-blue-600">.</span>
                  </h1>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Demandas Dropdown */}
              <div className="space-y-1">
                <button
                  onClick={() => setDemandasOpen(!demandasOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/15 hover:text-slate-800 dark:hover:text-blue-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5" />
                    {sidebarOpen && <span className="font-medium">Demandas</span>}
                  </div>
                  {sidebarOpen && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${demandasOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {demandasOpen && sidebarOpen && (
                  <div className="pl-4 space-y-1">
                    <a href="/dashboard/demandas" className={navItemClass('/dashboard/demandas')}>
                      <LayoutGrid className="h-4 w-4" />
                      <span>Kanban</span>
                    </a>
                    <a href="/dashboard/demandas/analises" className={navItemClass('/dashboard/demandas/analises')}>
                      <BarChart3 className="h-4 w-4" />
                      <span>Analises</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Admin: Logs */}
              {isAdmin && sidebarOpen && (
                <a href="/dashboard/logs" className={navItemClass('/dashboard/logs')}>
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Logs</span>
                </a>
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/80 dark:bg-[#0d1929]/80 border-b border-slate-200/80 dark:border-blue-900/20 backdrop-blur-xl transition-colors">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/15 cursor-pointer"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-white dark:bg-[#111d2e] border-slate-200 dark:border-blue-900/30 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-slate-800 dark:hover:text-blue-300 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
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
