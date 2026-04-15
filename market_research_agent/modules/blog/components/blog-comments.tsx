'use client';

import { useState, FormEvent } from 'react';
import { MessageCircle, Reply, Send, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitComment } from '@/actions/blog';

interface Comment {
    id: string;
    content: string;
    authorName: string;
    createdAt: Date;
    replies?: Comment[];
}

interface CommentSectionProps {
    postId: string;
    initialComments?: Comment[];
    commentCount?: number;
}

export function CommentSection({ postId, initialComments = [], commentCount = 0 }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [showForm, setShowForm] = useState(false);
    const [replyTo, setReplyTo] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" />
                    Comentarios ({commentCount})
                </h2>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? "outline" : "primary"}
                >
                    {showForm ? 'Cancelar' : 'Escribir comentario'}
                </Button>
            </div>

            {/* New Comment Form */}
            {showForm && (
                <CommentForm
                    postId={postId}
                    onSuccess={() => {
                        setShowForm(false);
                    }}
                />
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            onReply={() => setReplyTo(comment.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Sé el primero en comentar este artículo</p>
                </div>
            )}

            {/* Reply Form */}
            {replyTo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Responder al comentario</h3>
                        <CommentForm
                            postId={postId}
                            parentId={replyTo}
                            onSuccess={() => setReplyTo(null)}
                            onCancel={() => setReplyTo(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== COMMENT FORM ====================

interface CommentFormProps {
    postId: string;
    parentId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

function CommentForm({ postId, parentId, onSuccess, onCancel }: CommentFormProps) {
    const [content, setContent] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [authorEmail, setAuthorEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load saved author info from localStorage
    useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('comment_author');
            if (saved) {
                const { name, email } = JSON.parse(saved);
                setAuthorName(name || '');
                setAuthorEmail(email || '');
            }
        }
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!content.trim() || !authorName.trim() || !authorEmail.trim()) {
            setMessage({ type: 'error', text: 'Por favor, completa todos los campos.' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        // Save author info for next time
        localStorage.setItem('comment_author', JSON.stringify({ name: authorName, email: authorEmail }));

        const result = await submitComment({
            postId,
            content: content.trim(),
            authorName: authorName.trim(),
            authorEmail: authorEmail.trim(),
            parentId
        });

        setIsSubmitting(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setContent('');
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
            {/* Author Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                    </label>
                    <Input
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                    </label>
                    <Input
                        type="email"
                        value={authorEmail}
                        onChange={(e) => setAuthorEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">No será publicado</p>
                </div>
            </div>

            {/* Comment Content */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario *
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escribe tu comentario..."
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all"
                />
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success'
                        ? <CheckCircle2 className="h-5 w-5" />
                        : <AlertCircle className="h-5 w-5" />
                    }
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Enviando...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Enviar comentario
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}

// ==================== COMMENT CARD ====================

interface CommentCardProps {
    comment: Comment;
    postId: string;
    onReply: () => void;
}

function CommentCard({ comment, postId, onReply }: CommentCardProps) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="group">
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold">
                    {comment.authorName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{comment.authorName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                    </p>
                    <button
                        onClick={onReply}
                        className="mt-2 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Reply className="h-4 w-4" />
                        Responder
                    </button>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-bold">
                                        {reply.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{reply.authorName}</span>
                                            <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
