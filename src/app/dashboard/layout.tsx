'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { BarChart3, LogOut, Menu, ClipboardList, ChevronDown, LayoutGrid, FileText } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { DefenzLogoIcon } from '@/components/defenz-logo'
import Image from 'next/image'

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
    return <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
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
        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50/80 to-blue-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-700/30 min-h-screen`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-slate-200/70 dark:border-slate-700/30">
              <div className="flex items-center gap-2.5">
                <DefenzLogoIcon size={30} className="shrink-0" />
                {sidebarOpen && (
                  <Image
                    src="/defenz-text-blue.png"
                    alt="DEFENZ"
                    width={100}
                    height={19}
                    className="dark:brightness-200 dark:contrast-75"
                    priority
                  />
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <div className="space-y-1">
                <button
                  onClick={() => setDemandasOpen(!demandasOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
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
          <header className="bg-white/90 dark:bg-slate-900/40 border-b border-slate-200/70 dark:border-slate-700/30 backdrop-blur-xl transition-colors">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer"
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
                    className="flex items-center gap-2 bg-white/50 dark:bg-white/5 border-slate-200/50 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
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
