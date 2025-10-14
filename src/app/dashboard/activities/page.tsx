'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ActivitiesTable from '@/components/ActivitiesTable'
import { toast } from 'sonner'

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
    description: ''
  })

  useEffect(() => {
    // Fetch activities from database
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities')
        if (response.ok) {
          const data = await response.json()
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
        } else {
          const error = await response.json()
          toast.error(error.error || 'Erro ao criar atividade')
          return
        }
      }

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
        description: ''
      })
      setEditingActivity(null)
      setIsDialogOpen(false)
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
      description: activity.description
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
      description: ''
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha os detalhes da atividade estratégica (5W2H)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200 font-semibold">
                  O Quê? <span className="text-slate-400 font-normal">(What - Título da Ação)</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Descreva a ação a ser executada"
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area" className="text-slate-200 font-semibold">Área</Label>
                <Select value={formData.area} onValueChange={(value) => setFormData(prev => ({ ...prev, area: value }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    {areas.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200 font-semibold">
                Por Quê? <span className="text-slate-400 font-normal">(Why - Justificativa)</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Justifique a importância e o objetivo desta ação"
                rows={3}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-200">Prioridade</Label>
                <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="0">Alta</SelectItem>
                    <SelectItem value="1">Média</SelectItem>
                    <SelectItem value="2">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-200">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible" className="text-slate-200 font-semibold">
                  Quem? <span className="text-slate-400 font-normal">(Who - Responsável)</span>
                </Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                  placeholder="Nome do responsável pela execução"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-slate-200 font-semibold">
                  Quando? <span className="text-slate-400 font-normal">(When - Prazo)</span>
                </Label>
                <Input
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  placeholder="Ex: Semana 2-4, Contínuo, 14/10-19/11"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-200 font-semibold">
                  Onde? <span className="text-slate-400 font-normal">(Where - Local/Plataforma)</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Site, Google Ads, LinkedIn, Pipedrive"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-slate-200 font-semibold">
                  Quanto? <span className="text-slate-400 font-normal">(How Much - Custo)</span>
                </Label>
                <Input
                  id="cost"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Ex: R$ 5.000, 14/10-19/11, Horas internas"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="how" className="text-slate-200 font-semibold">
                Como? <span className="text-slate-400 font-normal">(How - Método/Processo)</span>
              </Label>
              <Textarea
                id="how"
                value={formData.how}
                onChange={(e) => setFormData(prev => ({ ...prev, how: e.target.value }))}
                placeholder="Descreva o método, processo e etapas para execução desta ação"
                rows={4}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingActivity ? 'Atualizar' : 'Criar'} Atividade
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          {viewingActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{viewingActivity.title}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Detalhes completos da atividade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-slate-400 text-sm font-semibold">
                        Por Quê? <span className="font-normal">(Why - Justificativa)</span>
                      </Label>
                      <p className="text-slate-100 mt-1 whitespace-pre-wrap">{viewingActivity.description || 'Não especificado'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-400 text-sm">Área</Label>
                        <p className="text-slate-100 mt-1">{viewingActivity.area}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Prioridade</Label>
                        <p className="text-slate-100 mt-1">
                          {viewingActivity.priority === 0 ? '🔴 Alta' : viewingActivity.priority === 1 ? '🟡 Média' : '🟢 Baixa'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Status</Label>
                        <p className="text-slate-100 mt-1">
                          {viewingActivity.status === 'pending' ? '⏳ Pendente' : viewingActivity.status === 'in_progress' ? '🔄 Em Andamento' : '✅ Concluído'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Quem? (Who - Responsável)</Label>
                        <p className="text-slate-100 mt-1">{viewingActivity.responsible || 'Não definido'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Quando? (When - Prazo)</Label>
                        <p className="text-slate-100 mt-1">{viewingActivity.deadline || 'Não definido'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Onde? (Where - Local)</Label>
                        <p className="text-slate-100 mt-1">{viewingActivity.location || 'Não definido'}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-slate-400 text-sm">Quanto? (How Much - Custo)</Label>
                        <p className="text-slate-100 mt-1">{viewingActivity.cost || 'Não definido'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm font-semibold">
                        Como? <span className="font-normal">(How - Método/Processo)</span>
                      </Label>
                      <p className="text-slate-100 mt-1 whitespace-pre-wrap">{viewingActivity.how || 'Não especificado'}</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                  <Button onClick={() => setIsViewDialogOpen(false)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(viewingActivity)
                  }} className="bg-blue-600 hover:bg-blue-700">
                    Editar Atividade
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
