'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Bell, Mail, Save, TestTube } from 'lucide-react'

interface NotificationPreferences {
  activityAssigned: boolean
  deadlineApproaching: boolean
  statusChanged: boolean
  activityDeleted: boolean
  dailyDigest: boolean
  weeklyReport: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

export default function NotificationsSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    activityAssigned: true,
    deadlineApproaching: true,
    statusChanged: true,
    activityDeleted: true,
    dailyDigest: false,
    weeklyReport: false,
    quietHoursStart: null,
    quietHoursEnd: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Erro ao carregar preferências')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        toast.success('Preferências salvas com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar preferências')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Erro ao salvar preferências')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Email de teste enviado!')
      } else {
        toast.error(data.error || 'Erro ao enviar email de teste')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Erro ao enviar email de teste')
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="text-slate-300">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-400" />
            Notificações por Email
          </h1>
          <p className="text-slate-400 mt-2">
            Configure quando e como você deseja receber notificações sobre suas atividades.
          </p>
        </div>

        {/* Email Notifications Card */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Mail className="h-5 w-5 text-blue-400" />
              Tipos de Notificação
            </CardTitle>
            <CardDescription className="text-slate-400">
              Escolha quais eventos devem gerar notificações por email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activityAssigned" className="text-slate-200">
                  Atividade Atribuída
                </Label>
                <p className="text-sm text-slate-400">
                  Receber email quando uma atividade for atribuída a você
                </p>
              </div>
              <Switch
                id="activityAssigned"
                checked={preferences.activityAssigned}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, activityAssigned: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deadlineApproaching" className="text-slate-200">
                  Prazo Próximo
                </Label>
                <p className="text-sm text-slate-400">
                  Receber lembretes 24 horas antes do prazo
                </p>
              </div>
              <Switch
                id="deadlineApproaching"
                checked={preferences.deadlineApproaching}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, deadlineApproaching: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="statusChanged" className="text-slate-200">
                  Status Alterado
                </Label>
                <p className="text-sm text-slate-400">
                  Receber email quando o status de uma atividade mudar
                </p>
              </div>
              <Switch
                id="statusChanged"
                checked={preferences.statusChanged}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, statusChanged: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activityDeleted" className="text-slate-200">
                  Atividade Deletada
                </Label>
                <p className="text-sm text-slate-400">
                  Receber email quando uma atividade for deletada
                </p>
              </div>
              <Switch
                id="activityDeleted"
                checked={preferences.activityDeleted}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, activityDeleted: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dailyDigest" className="text-slate-200">
                  Resumo Diário
                </Label>
                <p className="text-sm text-slate-400">
                  Receber um resumo diário das atividades pendentes
                </p>
              </div>
              <Switch
                id="dailyDigest"
                checked={preferences.dailyDigest}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, dailyDigest: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weeklyReport" className="text-slate-200">
                  Relatório Semanal
                </Label>
                <p className="text-sm text-slate-400">
                  Receber um relatório semanal com suas estatísticas
                </p>
              </div>
              <Switch
                id="weeklyReport"
                checked={preferences.weeklyReport}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, weeklyReport: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours Card */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Horário de Silêncio</CardTitle>
            <CardDescription className="text-slate-400">
              Configure um período em que você não deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart" className="text-slate-200">
                  Início (HH:MM)
                </Label>
                <Input
                  id="quietHoursStart"
                  type="time"
                  value={preferences.quietHoursStart || ''}
                  onChange={(e) =>
                    setPreferences({ ...preferences, quietHoursStart: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd" className="text-slate-200">
                  Fim (HH:MM)
                </Label>
                <Input
                  id="quietHoursEnd"
                  type="time"
                  value={preferences.quietHoursEnd || ''}
                  onChange={(e) =>
                    setPreferences({ ...preferences, quietHoursEnd: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Exemplo: 22:00 até 08:00 (não receberá notificações durante a noite)
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
          <Button
            onClick={handleTestEmail}
            disabled={isTesting}
            variant="outline"
            className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Enviando...' : 'Enviar Email de Teste'}
          </Button>
        </div>
      </div>
    </div>
  )
}
