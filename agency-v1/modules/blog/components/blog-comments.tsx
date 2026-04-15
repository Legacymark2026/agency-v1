'use client';

import { useState, FormEvent } from 'react';
import { MessageCircle, Reply, Send, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitComment } from '@/actions/blog';
import { CommentLikeButton } from './comment-like-button';

interface Comment {
    id: string;
    content: string;
    authorName: string;
    createdAt: Date;
    likeCount: number;
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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-black rounded-xl">
                        <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    Comentarios ({commentCount})
                </h2>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className={showForm ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}
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
                <div className="space-y-4">
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
                <div className="text-center py-16 px-6 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">Sé el primero en comentar este artículo</p>
                    <p className="text-gray-400 text-sm mt-1">Comparte tu opinión con nosotros</p>
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
        <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Deja tu comentario</h3>
                <p className="text-sm text-gray-500">Los campos marcados con * son obligatorios</p>
            </div>
            
            {/* Author Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Nombre *
                    </label>
                    <Input
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                        className="h-12 bg-gray-50 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Email *
                    </label>
                    <Input
                        type="email"
                        value={authorEmail}
                        onChange={(e) => setAuthorEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                        className="h-12 bg-gray-50 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                    />
                    <p className="text-xs text-gray-400">No será publicado</p>
                </div>
            </div>

            {/* Comment Content */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Comentario *
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Comparte tu opinión sobre este artículo..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 rounded-xl resize-none transition-all text-gray-700 placeholder:text-gray-400"
                />
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success'
                        ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        : <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    }
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="px-6">
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="px-8">
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Enviando...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Publicar comentario
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
        <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {comment.authorName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900 text-lg">{comment.authorName}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                        {comment.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={onReply}
                            className="text-sm text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors"
                        >
                            <Reply className="h-4 w-4" />
                            Responder
                        </button>
                        <CommentLikeButton
                            commentId={comment.id}
                            initialCount={comment.likeCount}
                            initialLiked={false}
                        />
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-5 space-y-4 pl-4 border-l-2 border-indigo-100">
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-bold">
                                        {reply.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{reply.authorName}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">{reply.content}</p>
                                        <div className="mt-2">
                                            <CommentLikeButton
                                                commentId={reply.id}
                                                initialCount={reply.likeCount || 0}
                                                initialLiked={false}
                                            />
                                        </div>
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
