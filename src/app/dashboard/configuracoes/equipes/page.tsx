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

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCompanyId, setNewCompanyId] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamInfo | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState<TeamInfo | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Branding
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('')
  const [brandingAccentColor, setBrandingAccentColor] = useState('#2563eb')
  const [savingBranding, setSavingBranding] = useState(false)

  const userRole = (session?.user as { role?: string })?.role || ''
  const isAdmin = userRole === 'admin'
  const isAdminOrGerencia = ['admin', 'gerencia'].includes(userRole)

  const fetchData = useCallback(async () => {
    try {
      const fetches = [fetch('/api/teams')]
      if (isAdmin) fetches.push(fetch('/api/companies'))

      const [teamsRes, companiesRes] = await Promise.all(fetches)
      const teamsData = await teamsRes.json()
      if (teamsData.success) setTeams(teamsData.data)

      if (companiesRes) {
        const companiesData = await companiesRes.json()
        if (companiesData.success) {
          setCompanies(companiesData.data)
          if (companiesData.data.length > 0 && !newCompanyId) {
            setNewCompanyId(companiesData.data[0].id)
          }
          // Populate branding from user's company
          const userCompanyId = (session?.user as { companyId?: string })?.companyId
          const userCompany = companiesData.data.find((c: CompanyInfo) => c.id === userCompanyId)
          if (userCompany) {
            setBrandingLogoUrl(userCompany.logoUrl || '')
            setBrandingAccentColor(userCompany.accentColor || '#2563eb')
          }
        }
      }
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdminOrGerencia) {
      router.push('/dashboard/demandas')
      return
    }
    fetchData()
  }, [isAdminOrGerencia, router, fetchData])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Nome da equipe e obrigatorio')
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

  const openEdit = (team: TeamInfo) => {
    setEditingTeam(team)
    setEditName(team.name)
    setEditOpen(true)
  }

  const handleSave = async () => {
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

  const openDelete = (team: TeamInfo) => {
    setDeletingTeam(team)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
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

  const handleSaveBranding = async () => {
    const userCompanyId = (session?.user as { companyId?: string })?.companyId
    if (!userCompanyId) return
    setSavingBranding(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCompanyId,
          logoUrl: brandingLogoUrl.trim() || null,
          accentColor: brandingAccentColor || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Branding atualizado. Faca logout e login para ver as mudancas.')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao salvar branding')
      }
    } catch {
      toast.error('Erro ao salvar branding')
    } finally {
      setSavingBranding(false)
    }
  }

  if (!isAdminOrGerencia) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <UsersRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Equipes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Crie e gerencie equipes da empresa</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* Branding Section — admin only */}
      {isAdmin && (
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-500" />
              Identidade Visual da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo URL */}
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  URL da Logo
                </Label>
                <Input
                  placeholder="https://cdn.example.com/logo.png"
                  value={brandingLogoUrl}
                  onChange={(e) => setBrandingLogoUrl(e.target.value)}
                  className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
                {brandingLogoUrl && (
                  <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center">
                    <img
                      src={brandingLogoUrl}
                      alt="Preview logo"
                      className="h-10 w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4 text-slate-400" />
                  Cor Accent
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingAccentColor}
                    onChange={(e) => setBrandingAccentColor(e.target.value)}
                    className="h-10 w-14 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                  />
                  <Input
                    value={brandingAccentColor}
                    onChange={(e) => setBrandingAccentColor(e.target.value)}
                    placeholder="#2563eb"
                    className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-sm flex-1"
                    maxLength={7}
                  />
                </div>
                {/* Color preview */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: brandingAccentColor }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Preview da cor accent
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveBranding}
                disabled={savingBranding}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {savingBranding ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Salvar Branding
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Table */}
      <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Equipes ({teams.length})
          </CardTitle>
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
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
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
                            onClick={() => openEdit(team)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            title="Renomear equipe"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(team)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            title="Remover equipe"
                            disabled={team._count.members > 0 || team._count.demandas > 0}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
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
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar Equipe
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
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

      {/* Delete Dialog */}
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
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Removendo...
                </span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Remover
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
