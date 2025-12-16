'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ActivitiesTable from '@/components/ActivitiesTable'
import { ActivityInsightCard } from '@/components/activities'
import { toast } from 'sonner'
import { Sparkles, Loader2, Link as LinkIcon } from 'lucide-react'
import { OpportunitySelector } from '@/components/crm/opportunity-selector'

interface Activity {
  id: string
  title: string
  area: string
  priority: number
  status: string
  responsible: string
  deadline: string
  location: string
  how: string
  cost: string
  description: string
  createdAt: string
  updatedAt: string
  opportunities?: {
    id: string
    title: string
    status: string
    client: { name: string } | null
  }[]
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    area: '',
    priority: 1,
    status: 'pending',
    responsible: '',
    deadline: '',
    location: '',
    how: '',
    cost: '',
    description: '',
    opportunityIds: [] as string[]
  })

  // Estados para geração de insights IA
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [newActivityId, setNewActivityId] = useState<string | null>(null)
  const [insightGenerationCancelled, setInsightGenerationCancelled] = useState(false)

  useEffect(() => {
    // Fetch activities from database
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities')
        if (response.ok) {
          const result = await response.json()
          // A API retorna { success: true, data: activities[], count: number }
          const data = result.data || []
          setActivities(data)
        } else {
          toast.error('Erro ao carregar atividades')
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
        toast.error('Erro ao carregar atividades')
      }
    }

    fetchActivities()
  }, [])

  // Função para gerar insights de IA
  const generateInsights = async (activityId: string) => {
    setIsGeneratingInsights(true)
    setInsightGenerationCancelled(false)

    const timeoutId = setTimeout(() => {
      if (isGeneratingInsights) {
        toast.warning('A análise está demorando mais que o esperado. Você pode cancelar se desejar.', {
          duration: 5000
        })
      }
    }, 10000)

    try {
      const response = await fetch(`/api/activities/${activityId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      clearTimeout(timeoutId)

      if (insightGenerationCancelled) {
        // Usuário cancelou durante a geração
        return
      }

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Limite de requisições atingido', {
            description: 'Aguarde 1 minuto e tente novamente. Rate limit: 10 análises/minuto'
          })
          return
        }

        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}))
          toast.error('Erro ao processar análise de IA', {
            description: errorData.error || 'Erro interno do servidor'
          })
          return
        }

        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Calcular overall score (40% business + 60% M&A)
      const overallScore = Math.round(data.businessScore * 0.4 + data.maScore * 0.6)

      toast.success('Análise de IA gerada com sucesso!', {
        description: `Score geral: ${overallScore}/100 • Confiança: ${Math.round(data.aiConfidence * 100)}%`,
        icon: <Sparkles className="size-4 text-blue-500" />
      })
    } catch (error) {
      if (insightGenerationCancelled) {
        return
      }
      console.error('Error generating insights:', error)
      toast.error('Erro ao gerar análise de IA')
    } finally {
      clearTimeout(timeoutId)
      setIsGeneratingInsights(false)
    }
  }

  // Handler para quando usuário confirma geração de insights
  const handleGenerateInsights = async () => {
    if (!newActivityId) return

    setNewActivityId(null) // Fecha o dialog
    await generateInsights(newActivityId)
  }

  // Handler para cancelar geração de insights
  const handleCancelInsightGeneration = () => {
    setInsightGenerationCancelled(true)
    setIsGeneratingInsights(false)
    setNewActivityId(null)
    toast.info('Geração de análise cancelada')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingActivity) {
        // Update existing activity
        const response = await fetch(`/api/activities/${editingActivity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const updatedActivity = await response.json()
          setActivities(prev => prev.map(activity =>
            activity.id === editingActivity.id ? updatedActivity : activity
          ))
          toast.success('Atividade atualizada com sucesso!')
        } else {
          toast.error('Erro ao atualizar atividade')
          return
        }

        // Reset form e fecha dialog
        setFormData({
          title: '',
          area: '',
          priority: 1,
          status: 'pending',
          responsible: '',
          deadline: '',
          location: '',
          how: '',
          cost: '',
          description: '',
          opportunityIds: []
        })
        setEditingActivity(null)
        setIsDialogOpen(false)
      } else {
        // Create new activity
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const newActivity = await response.json()
          setActivities(prev => [...prev, newActivity])
          toast.success('Atividade criada com sucesso!')

          // Reset form
          setFormData({
            title: '',
            area: '',
            priority: 1,
            status: 'pending',
            responsible: '',
            deadline: '',
            location: '',
            how: '',
            cost: '',
            description: '',
            opportunityIds: []
          })
          setEditingActivity(null)
          setIsDialogOpen(false)

          // LÓGICA DE GERAÇÃO DE INSIGHTS
          // Se prioridade ALTA (0), auto-gerar insights
          if (formData.priority === 0) {
            toast.info('Gerando análise de IA para atividade de alta prioridade...', {
              icon: <Loader2 className="size-4 animate-spin text-primary" />
            })
            await generateInsights(newActivity.id)
          }
          // Se prioridade MÉDIA (1) ou BAIXA (2), perguntar ao usuário
          else {
            setNewActivityId(newActivity.id)
          }
        } else {
          const error = await response.json()
          toast.error(error.error || 'Erro ao criar atividade')
          return
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Erro ao salvar atividade')
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      title: activity.title,
      area: activity.area,
      priority: activity.priority,
      status: activity.status,
      responsible: activity.responsible,
      deadline: activity.deadline,
      location: activity.location,
      how: activity.how,
      cost: activity.cost,
      description: activity.description,
      opportunityIds: activity.opportunities?.map(o => o.id) || []
    })
    setIsDialogOpen(true)
  }

  const handleView = (activity: Activity) => {
    setViewingActivity(activity)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Tem certeza que deseja deletar "${activity.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/activities/${activity.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActivities(prev => prev.filter(a => a.id !== activity.id))
        toast.success('Atividade deletada com sucesso!')
      } else {
        toast.error('Erro ao deletar atividade')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erro ao deletar atividade')
    }
  }

  const handleAddNew = () => {
    setEditingActivity(null)
    setFormData({
      title: '',
      area: '',
      priority: 1,
      status: 'pending',
      responsible: '',
      deadline: '',
      location: '',
      how: '',
      cost: '',
      description: '',
      opportunityIds: []
    })
    setIsDialogOpen(true)
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/activities/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Save each activity to the database
        const importPromises = result.data.map(async (activityData: any) => {
          try {
            const response = await fetch('/api/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(activityData)
            })

            if (response.ok) {
              return await response.json()
            } else if (response.status === 409) {
              // Duplicate - skip silently
              return null
            } else {
              console.error('Failed to save activity:', activityData.title)
              return null
            }
          } catch (error) {
            console.error('Error saving activity:', error)
            return null
          }
        })

        const savedActivities = (await Promise.all(importPromises)).filter(Boolean)

        // Update local state with saved activities
        if (savedActivities.length > 0) {
          setActivities(prev => [...prev, ...savedActivities])
        }

        const duplicatesCount = result.data.length - savedActivities.length

        if (duplicatesCount > 0) {
          toast.success(`✅ ${savedActivities.length} atividades importadas, ${duplicatesCount} duplicadas ignoradas`)
        } else {
          toast.success(`✅ ${savedActivities.length} atividades importadas com sucesso!`)
        }
      } else {
        toast.error(result.error || 'Erro ao importar arquivo')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro ao fazer upload do arquivo')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/activities/export')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `atividades_defenz_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Planilha exportada com sucesso!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erro ao exportar planilha')
    }
  }

  const areas = ['Marketing', 'Vendas', 'Gestão', 'Estratégico', 'Back office']

  return (
    <div className="min-h-screen bg-background p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.ods"
        onChange={handleFileChange}
        className="hidden"
      />

      <ActivitiesTable
        activities={activities}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onAddNew={handleAddNew}
      />

      {/* Dialog para editar/criar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da atividade estratégica (5W2H)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">
                  O Quê? <span className="text-muted-foreground font-normal">(What - Título da Ação)</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Descreva a ação a ser executada"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area" className="font-semibold">Área</Label>
                <Select value={formData.area} onValueChange={(value) => setFormData(prev => ({ ...prev, area: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold">
                Por Quê? <span className="text-muted-foreground font-normal">(Why - Justificativa)</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Justifique a importância e o objetivo desta ação"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Alta</SelectItem>
                    <SelectItem value="1">Média</SelectItem>
                    <SelectItem value="2">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible" className="font-semibold">
                  Quem? <span className="text-muted-foreground font-normal">(Who - Responsável)</span>
                </Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                  placeholder="Nome do responsável pela execução"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="font-semibold">
                  Quando? <span className="text-muted-foreground font-normal">(When - Prazo)</span>
                </Label>
                <Input
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  placeholder="Ex: Semana 2-4, Contínuo, 14/10-19/11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold">
                  Onde? <span className="text-muted-foreground font-normal">(Where - Local/Plataforma)</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Site, Google Ads, LinkedIn, Pipedrive"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="font-semibold">
                  Quanto? <span className="text-muted-foreground font-normal">(How Much - Custo)</span>
                </Label>
                <Input
                  id="cost"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Ex: R$ 5.000, 14/10-19/11, Horas internas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="how" className="font-semibold">
                Como? <span className="text-muted-foreground font-normal">(How - Método/Processo)</span>
              </Label>
              <Textarea
                id="how"
                value={formData.how}
                onChange={(e) => setFormData(prev => ({ ...prev, how: e.target.value }))}
                placeholder="Descreva o método, processo e etapas para execução desta ação"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Vincular CRM</Label>
              <OpportunitySelector
                selectedIds={formData.opportunityIds}
                onSelect={(ids) => setFormData(prev => ({ ...prev, opportunityIds: ids }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {editingActivity ? 'Atualizar' : 'Criar'} Atividade
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{viewingActivity.title}</DialogTitle>
                <DialogDescription>
                  Detalhes completos da atividade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* AI Insights Section */}
                <ActivityInsightCard activityId={viewingActivity.id} />

                <Card className="bg-muted/50">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm font-semibold">
                        Por Quê? <span className="font-normal">(Why - Justificativa)</span>
                      </Label>
                      <p className="mt-1 whitespace-pre-wrap">{viewingActivity.description || 'Não especificado'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Área</Label>
                        <p className="mt-1">{viewingActivity.area}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Prioridade</Label>
                        <p className="mt-1">
                          {viewingActivity.priority === 0 ? '🔴 Alta' : viewingActivity.priority === 1 ? '🟡 Média' : '🟢 Baixa'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Status</Label>
                        <p className="mt-1">
                          {viewingActivity.status === 'pending' ? '⏳ Pendente' : viewingActivity.status === 'in_progress' ? '🔄 Em Andamento' : '✅ Concluído'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Quem? (Who - Responsável)</Label>
                        <p className="mt-1">{viewingActivity.responsible || 'Não definido'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Quando? (When - Prazo)</Label>
                        <p className="mt-1">{viewingActivity.deadline || 'Não definido'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Onde? (Where - Local)</Label>
                        <p className="mt-1">{viewingActivity.location || 'Não definido'}</p>
                      </div>

                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-sm">Oportunidades Vinculadas</Label>
                      {viewingActivity.opportunities && viewingActivity.opportunities.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewingActivity.opportunities.map(opp => (
                            <div key={opp.id} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs border">
                              <LinkIcon className="size-3" />
                              <span className="font-medium">{opp.title}</span>
                              <span className="text-muted-foreground">({opp.client?.name || 'Sem cliente'})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-muted-foreground">Nenhuma vinculada</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-sm">Quanto? (How Much - Custo)</Label>
                      <p className="mt-1">{viewingActivity.cost || 'Não definido'}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-sm font-semibold">
                        Como? <span className="font-normal">(How - Método/Processo)</span>
                      </Label>
                      <p className="mt-1 whitespace-pre-wrap">{viewingActivity.how || 'Não especificado'}</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                  <Button onClick={() => setIsViewDialogOpen(false)} variant="outline">
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(viewingActivity)
                  }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Editar Atividade
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmação de geração de insights */}
      <AlertDialog open={!!newActivityId && !isGeneratingInsights} onOpenChange={(open) => !open && setNewActivityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Sparkles className="size-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-xl">Gerar Análise de IA?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              A Inteligência Artificial pode analisar esta atividade e identificar automaticamente:
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Conexões com métricas operacionais do seu negócio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Impactos em métricas estratégicas de M&A e valorização</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Score de relevância para o crescimento do negócio</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Powered by Google Gemini AI • Rate limit: 10 análises/minuto
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Agora Não
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateInsights}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="size-4 mr-2" />
              Gerar Análise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}
