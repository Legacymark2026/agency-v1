'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, Edit, Trash2, Check, X, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  approved: boolean;
  deleted: boolean;
  createdAt: Date;
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

interface CommentsAdminProps {
  initialComments: Comment[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function CommentsAdmin({ initialComments, total, currentPage, totalPages }: CommentsAdminProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'deleted'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredComments = comments.filter(c => {
    const matchesSearch = c.content.toLowerCase().includes(search.toLowerCase()) ||
                         c.authorName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'approved' && c.approved) ||
                         (statusFilter === 'pending' && !c.approved) ||
                         (statusFilter === 'deleted' && c.deleted);
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (commentId: string, approved: boolean) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved }),
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, approved } : c
      ));
    } catch (error) {
      console.error('Error approving comment:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;
    
    setLoading(true);
    try {
      await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, deleted: true } : c
      ));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
    setLoading(false);
  };

  const handleRestore = async (commentId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action: 'restore' }),
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, deleted: false } : c
      ));
    } catch (error) {
      console.error('Error restoring comment:', error);
    }
    setLoading(false);
  };

  const handleEdit = async (commentId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editContent }),
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: editContent } : c
      ));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
    setLoading(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-teal-400" />
            Comentarios del Blog
          </h1>
          <p className="text-slate-400 mt-1">
            Total: {total} comentarios
          </p>
        </div>
        <Link href="/dashboard/posts" className="text-teal-400 hover:underline">
          ← Volver a Posts
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar comentarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'bg-teal-600' : 'border-slate-700 text-slate-300'}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('approved')}
            className={statusFilter === 'approved' ? 'bg-teal-600' : 'border-slate-700 text-slate-300'}
            size="sm"
          >
            Aprobados
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            className={statusFilter === 'pending' ? 'bg-teal-600' : 'border-slate-700 text-slate-300'}
            size="sm"
          >
            Pendientes
          </Button>
          <Button
            variant={statusFilter === 'deleted' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('deleted')}
            className={statusFilter === 'deleted' ? 'bg-red-600' : 'border-slate-700 text-slate-300'}
            size="sm"
          >
            Eliminados
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No se encontraron comentarios</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.deleted 
                  ? 'bg-red-950/20 border-red-800' 
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-bold">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{comment.authorName}</p>
                    <p className="text-sm text-slate-400">{comment.authorEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {comment.deleted ? (
                    <Badge variant="destructive">Eliminado</Badge>
                  ) : comment.approved ? (
                    <Badge className="bg-green-600">Aprobado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      Pendiente
                    </Badge>
                  )}
                </div>
              </div>

              {/* Post Link */}
              <Link 
                href={`/blog/${comment.post.slug}`}
                className="text-sm text-teal-400 hover:underline mb-2 inline-block"
              >
                En: {comment.post.title}
              </Link>

              {/* Content */}
              {editingId === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(comment.id)}
                      disabled={loading}
                      className="bg-teal-600"
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="border-slate-700 text-slate-300"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`text-slate-300 mb-3 ${comment.deleted ? 'opacity-50' : ''}`}>
                  {comment.content}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-500">
                  {formatDate(comment.createdAt)}
                </span>
                
                {!comment.deleted && (
                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Approve/Disapprove Button */}
                    {comment.approved ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(comment.id, false)}
                        disabled={loading}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Desaprobar"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(comment.id, true)}
                        disabled={loading}
                        className="text-green-400 hover:text-green-300"
                        title="Aprobar"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(comment.id)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {comment.deleted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRestore(comment.id)}
                    disabled={loading}
                    className="text-green-400 hover:text-green-300"
                    title="Restaurar"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('page', page.toString());
                window.location.href = url.toString();
              }}
              className={page === currentPage ? 'bg-teal-600' : 'border-slate-700 text-slate-300'}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}