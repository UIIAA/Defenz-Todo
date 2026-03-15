'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { BarChart3, LogOut, Menu, ClipboardList, ChevronDown, LayoutGrid, FileText, Settings, User, Search, Users } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { DefenzLogoIcon } from '@/components/defenz-logo'
import { UserAvatar } from '@/components/user-avatar'
import { SearchCommand } from '@/components/search-command'
import type { Demanda } from '@/app/dashboard/demandas/helpers'
import Image from 'next/image'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [demandasOpen, setDemandasOpen] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchDemandas, setSearchDemandas] = useState<Demanda[]>([])
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

  // Fetch demandas when search opens
  const fetchSearchDemandas = useCallback(async () => {
    try {
      const res = await fetch('/api/demandas')
      const json = await res.json()
      if (json.success) {
        setSearchDemandas(json.data)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (searchOpen && searchDemandas.length === 0) {
      fetchSearchDemandas()
    }
  }, [searchOpen, searchDemandas.length, fetchSearchDemandas])

  const handleSearchSelectDemanda = useCallback(
    (_d: Demanda) => {
      router.push('/dashboard/demandas')
    },
    [router]
  )

  const handleSearchNavigate = useCallback(
    (path: string) => {
      router.push(path)
    },
    [router]
  )

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-[#F0F4F8] dark:bg-slate-900 flex items-center justify-center">
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
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm cursor-pointer ${
      isActive(path)
        ? 'bg-blue-500 text-white font-semibold'
        : 'text-slate-400 hover:text-white hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-slate-900 transition-colors">
      <div className="flex">
        {/* Sidebar - always dark navy */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 bg-[#1C2536] min-h-screen`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <DefenzLogoIcon size={30} className="shrink-0 brightness-0 invert" />
                {sidebarOpen && (
                  <Image
                    src="/defenz-text-blue.png"
                    alt="DEFENZ"
                    width={100}
                    height={19}
                    className="brightness-0 invert"
                    priority
                  />
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Demandas dropdown */}
              <div className="space-y-1">
                <button
                  onClick={() => setDemandasOpen(!demandasOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5" />
                    {sidebarOpen && <span className="font-medium text-white">Demandas</span>}
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

              {/* Configuracoes dropdown - admin only */}
              {isAdmin && sidebarOpen && (
                <div className="space-y-1">
                  <button
                    onClick={() => setConfigOpen(!configOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium text-white">Configuracoes</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${configOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {configOpen && (
                    <div className="pl-4 space-y-1">
                      <a href="/dashboard/logs" className={navItemClass('/dashboard/logs')}>
                        <FileText className="h-4 w-4" />
                        <span>Logs</span>
                      </a>
                      <a href="/dashboard/configuracoes/usuarios" className={navItemClass('/dashboard/configuracoes/usuarios')}>
                        <Users className="h-4 w-4" />
                        <span>Usuarios</span>
                      </a>
                      <a href="/dashboard/configuracoes/perfil" className={navItemClass('/dashboard/configuracoes/perfil')}>
                        <User className="h-4 w-4" />
                        <span>Perfil</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* User info + logout at bottom */}
            {sidebarOpen && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-2 mb-3">
                  <UserAvatar name={session?.user?.name || session?.user?.email} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {session?.user?.name || session?.user?.email}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {userRole || 'user'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-500 flex items-center gap-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Buscar...</span>
                    <kbd className="hidden sm:inline-block text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
                      ⌘K
                    </kbd>
                  </button>
                  <ThemeToggle />
                  <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
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

      <SearchCommand
        demandas={searchDemandas}
        onSelectDemanda={handleSearchSelectDemanda}
        onNavigate={handleSearchNavigate}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  )
}
