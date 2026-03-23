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
import { Users, Plus, Copy, Check, Link2, Clock, Mail, Pencil, Trash2, X, KeyRound, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface UserInfo {
  id: string
  name: string | null
  email: string
  role: string
  position: string | null
  createdAt: string
}

interface InviteInfo {
  id: string
  token: string
  email: string | null
  role: string
  createdAt: string
  expiresAt: string
  usedAt: string | null
  createdByUser: { id: string; name: string | null; email: string }
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [invites, setInvites] = useState<InviteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [creating, setCreating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // Edit user state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete user state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserInfo | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Password reset state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordUser, setPasswordUser] = useState<UserInfo | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  const userRole = (session?.user as { role?: string })?.role || ''
  const userId = (session?.user as { id?: string })?.id || ''
  const isAdmin = ['admin', 'gerencia'].includes(userRole)

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, invitesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/invites'),
      ])
      const usersData = await usersRes.json()
      const invitesData = await invitesRes.json()

      if (usersData.success) setUsers(usersData.data)
      if (invitesData.success) setInvites(invitesData.data)
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/demandas')
      return
    }
    fetchData()
  }, [isAdmin, router, fetchData])

  const handleCreateInvite = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail || undefined,
          role: inviteRole,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setGeneratedLink(data.data.inviteUrl)
        toast.success('Convite gerado com sucesso')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao gerar convite')
      }
    } catch {
      toast.error('Erro ao gerar convite')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar link')
    }
  }

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setInviteEmail('')
      setInviteRole('user')
      setGeneratedLink('')
      setCopied(false)
    }
  }

  // Edit user handlers
  const openEditDialog = (u: UserInfo) => {
    setEditingUser(u)
    setEditName(u.name || '')
    setEditRole(u.role)
    setEditPosition(u.position || '')
    setEditDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          position: editPosition,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario atualizado')
        setEditDialogOpen(false)
        setEditingUser(null)
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao atualizar')
      }
    } catch {
      toast.error('Erro ao atualizar usuario')
    } finally {
      setSaving(false)
    }
  }

  // Delete user handlers
  const openDeleteDialog = (u: UserInfo) => {
    setDeletingUser(u)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario removido')
        setDeleteDialogOpen(false)
        setDeletingUser(null)
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao remover')
      }
    } catch {
      toast.error('Erro ao remover usuario')
    } finally {
      setDeleting(false)
    }
  }

  // Password reset handlers
  const openPasswordDialog = (u: UserInfo) => {
    setPasswordUser(u)
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!passwordUser) return
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas nao coincidem')
      return
    }
    setResettingPassword(true)
    try {
      const res = await fetch(`/api/users/${passwordUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Senha redefinida com sucesso')
        setPasswordDialogOpen(false)
        setPasswordUser(null)
      } else {
        toast.error(data.error || 'Erro ao redefinir senha')
      }
    } catch {
      toast.error('Erro ao redefinir senha')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/invites?id=${inviteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Convite revogado')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao revogar convite')
      }
    } catch {
      toast.error('Erro ao revogar convite')
    }
  }

  const getInviteStatus = (invite: InviteInfo) => {
    if (invite.usedAt) return { label: 'Usado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    if (new Date(invite.expiresAt) < new Date()) return { label: 'Expirado', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' }
    return { label: 'Pendente', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (!isAdmin) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Usuarios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie usuarios e convites do sistema</p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Convidar Usuario
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Usuarios Cadastrados ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nome</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Cargo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Data cadastro</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-slate-200">{u.name || '--'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{u.email}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{u.position || '--'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          u.role === 'gerencia' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(u)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            title="Editar usuario"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordDialog(u)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                            title="Redefinir senha"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          {u.id !== userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(u)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              title="Remover usuario"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/* Invites Table */}
      <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Convites ({invites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Nenhum convite gerado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Link</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Criado por</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Data criacao</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => {
                    const status = getInviteStatus(inv)
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                    const inviteUrl = `${baseUrl}/register?token=${inv.token}`
                    return (
                      <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                          {inv.email ? (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {inv.email}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Generico</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{inv.role}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          {!inv.usedAt && new Date(inv.expiresAt) > new Date() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(inviteUrl)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer h-7 px-2"
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copiar
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {inv.createdByUser?.name || inv.createdByUser?.email || '--'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{formatDate(inv.createdAt)}</td>
                        <td className="py-3 px-4 text-right">
                          {status.label === 'Pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              title="Revogar convite"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-blue-600 dark:text-blue-400 text-lg font-bold">
              Convidar Usuario
            </DialogTitle>
          </DialogHeader>

          {!generatedLink ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium text-sm">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </Label>
                <Input
                  placeholder="Deixe vazio para gerar link generico"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  Role
                </Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="gerencia">gerencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                O convite expira em 7 dias
              </div>

              <Button
                onClick={handleCreateInvite}
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gerando...
                  </span>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Gerar Convite
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  Convite gerado com sucesso!
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mb-3">
                  Compartilhe o link abaixo com o usuario:
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedLink}
                    className="text-xs bg-white dark:bg-slate-900 border-green-200 dark:border-green-800 text-slate-700 dark:text-slate-300"
                  />
                  <Button
                    onClick={() => handleCopyLink(generatedLink)}
                    variant="outline"
                    className="shrink-0 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => handleCloseDialog(false)}
                variant="outline"
                className="w-full cursor-pointer"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-blue-600 dark:text-blue-400 text-lg font-bold">
              Editar Usuario
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Cargo</Label>
              <Input
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                placeholder="Ex: Desenvolvedor, Gerente"
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="gerencia">gerencia</SelectItem>
                  {userRole === 'admin' && <SelectItem value="admin">admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-amber-600 dark:text-amber-400 text-lg font-bold">
              Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              {passwordUser?.name || passwordUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 font-medium text-sm">Confirmar senha</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">As senhas nao coincidem</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={resettingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                {resettingPassword ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redefinindo...
                  </span>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-1.5" />
                    Redefinir
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 text-lg font-bold">
              Remover Usuario
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Tem certeza que deseja remover <strong>{deletingUser?.name || deletingUser?.email}</strong>?
              Demandas atribuidas a este usuario serao desvinculadas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteUser}
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
