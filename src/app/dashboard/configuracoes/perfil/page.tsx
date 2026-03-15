'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, User, Mail, Bell, Clock, Save, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  user: { id: string; name: string | null; email: string; role: string; createdAt: string }
  preferences: {
    notificationEmail: string | null
    emailEnabled: boolean
    activityAssigned: boolean
    deadlineApproaching: boolean
    statusChanged: boolean
    quietHoursStart: string | null
    quietHoursEnd: string | null
  }
}

export default function PerfilPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [activityAssigned, setActivityAssigned] = useState(true)
  const [deadlineApproaching, setDeadlineApproaching] = useState(true)
  const [statusChanged, setStatusChanged] = useState(true)
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      const json = await res.json()
      if (json.success) {
        setProfile(json.data)
        setName(json.data.user.name || '')
        setNotificationEmail(json.data.preferences.notificationEmail || '')
        setEmailEnabled(json.data.preferences.emailEnabled)
        setActivityAssigned(json.data.preferences.activityAssigned)
        setDeadlineApproaching(json.data.preferences.deadlineApproaching)
        setStatusChanged(json.data.preferences.statusChanged)
        setQuietStart(json.data.preferences.quietHoursStart || '')
        setQuietEnd(json.data.preferences.quietHoursEnd || '')
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          notificationEmail: notificationEmail || null,
          emailEnabled,
          activityAssigned,
          deadlineApproaching,
          statusChanged,
          quietHoursStart: quietStart || null,
          quietHoursEnd: quietEnd || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Preferencias salvas com sucesso')
      } else {
        toast.error(json.error || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro ao salvar preferencias')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Perfil
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Dados pessoais e preferencias de notificacao
        </p>
      </div>

      {/* User Info */}
      <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-blue-500" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email (login)
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              <Mail className="h-4 w-4" />
              {profile?.user.email}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Funcao
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              <Shield className="h-4 w-4" />
              {profile?.user.role || 'user'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-blue-500" />
            Notificacoes por Email
          </CardTitle>
          <CardDescription>
            Configure quando e como receber alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Master toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Receber notificacoes</p>
              <p className="text-xs text-slate-500">Ativar/desativar todas as notificacoes</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          {/* Notification email */}
          <div className="space-y-2">
            <Label htmlFor="notifEmail" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email para notificacoes
            </Label>
            <Input
              id="notifEmail"
              type="email"
              placeholder={profile?.user.email || 'Usa o email de login'}
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              disabled={!emailEnabled}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">Deixe vazio para usar o email de login</p>
          </div>

          {/* Individual toggles */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tipos de notificacao</p>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">Demanda atribuida</p>
                <p className="text-xs text-slate-500">Quando uma demanda for atribuida a voce</p>
              </div>
              <Switch checked={activityAssigned} onCheckedChange={setActivityAssigned} disabled={!emailEnabled} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">Prazo proximo</p>
                <p className="text-xs text-slate-500">24h antes do prazo da demanda</p>
              </div>
              <Switch checked={deadlineApproaching} onCheckedChange={setDeadlineApproaching} disabled={!emailEnabled} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">Status alterado</p>
                <p className="text-xs text-slate-500">Quando o status de uma demanda mudar</p>
              </div>
              <Switch checked={statusChanged} onCheckedChange={setStatusChanged} disabled={!emailEnabled} />
            </div>
          </div>

          {/* Quiet hours */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Horario silencioso</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Inicio</Label>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  disabled={!emailEnabled}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Fim</Label>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  disabled={!emailEnabled}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 disabled:opacity-50"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Nenhum email sera enviado neste periodo</p>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Preferencias
        </Button>
      </div>
    </div>
  )
}
