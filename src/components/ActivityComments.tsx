'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Send, Edit2, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  userName: string
  userEmail: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface ActivityCommentsProps {
  activityId: string
  currentUserEmail: string
}

export default function ActivityComments({
  activityId,
  currentUserEmail
}: ActivityCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [activityId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('O comentário não pode estar vazio')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
        toast.success('Status atualizado!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao adicionar comentário')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Erro ao adicionar comentário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim()) {
      toast.error('O comentário não pode estar vazio')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/activities/${activityId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editingContent })
        }
      )

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(prev =>
          prev.map(c => (c.id === commentId ? updatedComment : c))
        )
        setEditingId(null)
        setEditingContent('')
        toast.success('Comentário atualizado!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar comentário')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Erro ao atualizar comentário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este comentário?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/activities/${activityId}/comments/${commentId}`,
        {
          method: 'DELETE'
        }
      )

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        toast.success('Comentário deletado!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao deletar comentário')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Erro ao deletar comentário')
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id)
    setEditingContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return dateString
    }
  }

  if (isFetching) {
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-400">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">Carregando atualizações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-300">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-semibold">
          Status Updates ({comments.length})
        </span>
      </div>

      {/* New Comment Input */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Adicionar atualização de status..."
          className="bg-slate-800 border-slate-700 text-slate-100 min-h-[80px] resize-none"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleAddComment}
            disabled={isLoading || !newComment.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhuma atualização ainda. Seja o primeiro a adicionar!
          </p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className="bg-slate-800/50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {getInitials(comment.userName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-slate-200">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.createdAt !== comment.updatedAt && (
                        <span className="text-xs text-slate-500 ml-1">
                          (editado)
                        </span>
                      )}
                    </div>

                    {/* Actions (only for owner) */}
                    {comment.userEmail === currentUserEmail && (
                      <div className="flex gap-1">
                        {editingId !== comment.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-slate-400 hover:text-blue-400"
                              onClick={() => startEditing(comment)}
                              disabled={isLoading}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={e => setEditingContent(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-slate-100 min-h-[60px] resize-none text-sm"
                        disabled={isLoading}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={isLoading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-slate-700"
                          onClick={cancelEditing}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
