'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UsersRound, Plus, Pencil, Trash2, Building2, Users, Hash, Palette, ImageIcon, Save } from 'lucide-react'
import { toast } from 'sonner'

interface CompanyInfo {
  id: string
  name: string
  logoUrl?: string | null
  accentColor?: string | null
  _count: { users: number; teams: number }
}

interface TeamInfo {
  id: string
  name: string
  companyId: string
  company?: { name: string }
  _count: { members: number; demandas: number }
}

export default function EquipesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [companies, setCompanies] = useState<CompanyInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Create team dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCompanyId, setNewCompanyId] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit team dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamInfo | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete team dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState<TeamInfo | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create company dialog
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyLogo, setNewCompanyLogo] = useState('')
  const [newCompanyColor, setNewCompanyColor] = useState('#2563eb')
  const [creatingCompany, setCreatingCompany] = useState(false)

  // Edit company dialog
  const [editCompanyOpen, setEditCompanyOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyInfo | null>(null)
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editCompanyLogo, setEditCompanyLogo] = useState('')
  const [editCompanyColor, setEditCompanyColor] = useState('#2563eb')
  const [savingCompany, setSavingCompany] = useState(false)

  // Delete company dialog
  const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<CompanyInfo | null>(null)
  const [deletingCompanyLoading, setDeletingCompanyLoading] = useState(false)

  const userRole = (session?.user as { role?: string })?.role || ''
  const userCompanyId = (session?.user as { companyId?: string })?.companyId
  const isAdmin = userRole === 'admin'
  const isAdminOrGerencia = ['admin', 'gerencia'].includes(userRole)

  const fetchData = useCallback(async () => {
    try {
      const fetches: Promise<Response>[] = [fetch('/api/teams')]
      if (isAdminOrGerencia) fetches.push(fetch('/api/companies'))

      const responses = await Promise.all(fetches)
      const teamsData = await responses[0].json()
      if (teamsData.success) setTeams(teamsData.data)

      if (responses[1]) {
        const companiesData = await responses[1].json()
        if (companiesData.success) {
          setCompanies(companiesData.data)
          // Auto-select first company for team creation
          if (companiesData.data.length > 0 && !newCompanyId) {
            setNewCompanyId(companiesData.data[0].id)
          }
        }
      }
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [isAdminOrGerencia])

  useEffect(() => {
    if (!isAdminOrGerencia) {
      router.push('/dashboard/demandas')
      return
    }
    fetchData()
  }, [isAdminOrGerencia, router, fetchData])

  // === COMPANY HANDLERS ===

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('Nome da empresa e obrigatorio')
      return
    }
    setCreatingCompany(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          logoUrl: newCompanyLogo.trim() || undefined,
          accentColor: newCompanyColor || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Empresa criada com sucesso')
        setCreateCompanyOpen(false)
        setNewCompanyName('')
        setNewCompanyLogo('')
        setNewCompanyColor('#2563eb')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao criar empresa')
      }
    } catch {
      toast.error('Erro ao criar empresa')
    } finally {
      setCreatingCompany(false)
    }
  }

  const openEditCompany = (company: CompanyInfo) => {
    setEditingCompany(company)
    setEditCompanyName(company.name)
    setEditCompanyLogo(company.logoUrl || '')
    setEditCompanyColor(company.accentColor || '#2563eb')
    setEditCompanyOpen(true)
  }

  const handleSaveCompany = async () => {
    if (!editingCompany) return
    setSavingCompany(true)
    try {
      const body: Record<string, unknown> = {
        id: editingCompany.id,
        logoUrl: editCompanyLogo.trim() || null,
        accentColor: editCompanyColor || null,
      }
      // Admin pode renomear, gerencia nao
      if (isAdmin) body.name = editCompanyName.trim()

      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Empresa atualizada. Faca logout/login para aplicar branding na sidebar.')
        setEditCompanyOpen(false)
        setEditingCompany(null)
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao atualizar empresa')
      }
    } catch {
      toast.error('Erro ao atualizar empresa')
    } finally {
      setSavingCompany(false)
    }
  }

  const openDeleteCompany = (company: CompanyInfo) => {
    setDeletingCompany(company)
    setDeleteCompanyOpen(true)
  }

  const handleDeleteCompany = async () => {
    if (!deletingCompany) return
    setDeletingCompanyLoading(true)
    try {
      const res = await fetch(`/api/companies?id=${deletingCompany.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Empresa removida')
        setDeleteCompanyOpen(false)
        setDeletingCompany(null)
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao remover empresa')
      }
    } catch {
      toast.error('Erro ao remover empresa')
    } finally {
      setDeletingCompanyLoading(false)
    }
  }

  // === TEAM HANDLERS ===

  const handleCreateTeam = async () => {
    if (!newName.trim()) {
      toast.error('Nome da equipe e obrigatorio')
      return
    }
    if (isAdmin && !newCompanyId) {
      toast.error('Selecione a empresa para a equipe')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          companyId: isAdmin ? newCompanyId : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Equipe criada com sucesso')
        setCreateOpen(false)
        setNewName('')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao criar equipe')
      }
    } catch {
      toast.error('Erro ao criar equipe')
    } finally {
      setCreating(false)
    }
  }

  const openEditTeam = (team: TeamInfo) => {
    setEditingTeam(team)
    setEditName(team.name)
    setEditOpen(true)
  }

  const handleSaveTeam = async () => {
    if (!editingTeam || !editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTeam.id, name: editName.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Equipe atualizada')
        setEditOpen(false)
        setEditingTeam(null)
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao atualizar')
      }
    } catch {
      toast.error('Erro ao atualizar equipe')
    } finally {
      setSaving(false)
    }
  }

  const openDeleteTeam = (team: TeamInfo) => {
    setDeletingTeam(team)
    setDeleteOpen(true)
  }

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/teams?id=${deletingTeam.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Equipe removida')
        setDeleteOpen(false)
        setDeletingTeam(null)
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao remover')
      }
    } catch {
      toast.error('Erro ao remover equipe')
    } finally {
      setDeleting(false)
    }
  }

  // For gerencia: show only their company
  const visibleCompanies = isAdmin
    ? companies
    : companies.filter((c) => c.id === userCompanyId)

  if (!isAdminOrGerencia) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Empresas & Equipes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie empresas, branding e equipes</p>
          </div>
        </div>
      </div>

      {/* === COMPANIES SECTION === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Empresas ({visibleCompanies.length})
          </h2>
          {isAdmin && (
            <Button
              onClick={() => setCreateCompanyOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Empresa
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : visibleCompanies.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhuma empresa cadastrada. {isAdmin ? 'Crie a primeira empresa.' : ''}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCompanies.map((company) => (
              <Card key={company.id} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30 overflow-hidden">
                {/* Color accent bar */}
                <div className="h-1.5" style={{ backgroundColor: company.accentColor || '#2563eb' }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="h-10 w-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: company.accentColor || '#2563eb' }}
                        >
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          {company.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div
                            className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-600"
                            style={{ backgroundColor: company.accentColor || '#2563eb' }}
                            title={company.accentColor || '#2563eb'}
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {company.accentColor || '#2563eb'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditCompany(company)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        title="Editar empresa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteCompany(company)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          title="Remover empresa"
                          disabled={company._count.users > 0 || company._count.teams > 0}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <UsersRound className="h-3.5 w-3.5" />
                      {company._count.teams} equipe(s)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {company._count.users} usuario(s)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* === TEAMS SECTION === */}
      <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-blue-500" />
            Equipes ({teams.length})
          </CardTitle>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Equipe
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Nenhuma equipe cadastrada. Crie a primeira equipe.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nome</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Empresa</th>
                    )}
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Membros</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Demandas</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const teamCompany = companies.find((c) => c.id === team.companyId)
                    return (
                      <tr key={team.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: teamCompany?.accentColor || '#2563eb' }}
                            />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{team.name}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 hidden sm:table-cell">
                            {team.company?.name ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                <Building2 className="h-3 w-3" />
                                {team.company.name}
                              </span>
                            ) : <span className="text-slate-400 text-sm">--</span>}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {team._count.members}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            {team._count.demandas}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditTeam(team)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              title="Renomear equipe"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteTeam(team)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              title="Remover equipe"
                              disabled={team._count.members > 0 || team._count.demandas > 0}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === DIALOGS === */}

      {/* Create Company Dialog */}
      <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
        <DialogContent className="sm:max-w-[460px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-indigo-600 dark:text-indigo-400 text-lg font-bold">
              Nova Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Nome</Label>
              <Input
                placeholder="Ex: Defenz, SecuriSoft"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCompany()}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                URL da Logo (opcional)
              </Label>
              <Input
                placeholder="https://cdn.example.com/logo.png"
                value={newCompanyLogo}
                onChange={(e) => setNewCompanyLogo(e.target.value)}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              {newCompanyLogo && (
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center">
                  <img src={newCompanyLogo} alt="Preview" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
                <Palette className="h-4 w-4 text-slate-400" />
                Cor Accent (opcional)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newCompanyColor}
                  onChange={(e) => setNewCompanyColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <Input
                  value={newCompanyColor}
                  onChange={(e) => setNewCompanyColor(e.target.value)}
                  placeholder="#2563eb"
                  className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-sm flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateCompanyOpen(false)} className="flex-1 cursor-pointer">Cancelar</Button>
              <Button
                onClick={handleCreateCompany}
                disabled={creatingCompany || !newCompanyName.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {creatingCompany ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </span>
                ) : (
                  <><Plus className="h-4 w-4 mr-1.5" />Criar Empresa</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="sm:max-w-[460px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-indigo-600 dark:text-indigo-400 text-lg font-bold">
              Editar Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Nome</Label>
                <Input
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                URL da Logo
              </Label>
              <Input
                placeholder="https://cdn.example.com/logo.png"
                value={editCompanyLogo}
                onChange={(e) => setEditCompanyLogo(e.target.value)}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              {editCompanyLogo && (
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center">
                  <img src={editCompanyLogo} alt="Preview" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
                <Palette className="h-4 w-4 text-slate-400" />
                Cor Accent
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editCompanyColor}
                  onChange={(e) => setEditCompanyColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <Input
                  value={editCompanyColor}
                  onChange={(e) => setEditCompanyColor(e.target.value)}
                  placeholder="#2563eb"
                  className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-sm flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditCompanyOpen(false)} className="flex-1 cursor-pointer">Cancelar</Button>
              <Button
                onClick={handleSaveCompany}
                disabled={savingCompany}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {savingCompany ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" />Salvar</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <Dialog open={deleteCompanyOpen} onOpenChange={setDeleteCompanyOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 text-lg font-bold">
              Remover Empresa
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Tem certeza que deseja remover a empresa <strong>{deletingCompany?.name}</strong>?
              {deletingCompany && (deletingCompany._count.users > 0 || deletingCompany._count.teams > 0) && (
                <span className="block mt-2 text-red-500">
                  Esta empresa possui {deletingCompany._count.teams} equipe(s) e {deletingCompany._count.users} usuario(s). Mova-os antes de remover.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteCompanyOpen(false)} className="flex-1 cursor-pointer">Cancelar</Button>
            <Button
              onClick={handleDeleteCompany}
              disabled={deletingCompanyLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {deletingCompanyLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Removendo...
                </span>
              ) : (
                <><Trash2 className="h-4 w-4 mr-1.5" />Remover</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-blue-600 dark:text-blue-400 text-lg font-bold">
              Nova Equipe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Nome da equipe</Label>
              <Input
                placeholder="Ex: Time Vendas, Suporte N1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>
            {isAdmin && companies.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium text-sm">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  Empresa
                </Label>
                <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                  <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isAdmin && companies.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Crie uma empresa primeiro antes de criar equipes.
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1 cursor-pointer">Cancelar</Button>
              <Button
                onClick={handleCreateTeam}
                disabled={creating || !newName.trim() || (isAdmin && !newCompanyId)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </span>
                ) : (
                  <><Plus className="h-4 w-4 mr-1.5" />Criar Equipe</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-blue-600 dark:text-blue-400 text-lg font-bold">
              Renomear Equipe
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              {editingTeam?.company?.name && `Empresa: ${editingTeam.company.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 cursor-pointer">Cancelar</Button>
              <Button
                onClick={handleSaveTeam}
                disabled={saving || !editName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 text-lg font-bold">
              Remover Equipe
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Tem certeza que deseja remover a equipe <strong>{deletingTeam?.name}</strong>?
              {deletingTeam && (deletingTeam._count.members > 0 || deletingTeam._count.demandas > 0) && (
                <span className="block mt-2 text-red-500">
                  Esta equipe possui {deletingTeam._count.members} membro(s) e {deletingTeam._count.demandas} demanda(s). Mova-os antes de remover.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1 cursor-pointer">Cancelar</Button>
            <Button
              onClick={handleDeleteTeam}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Removendo...
                </span>
              ) : (
                <><Trash2 className="h-4 w-4 mr-1.5" />Remover</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
