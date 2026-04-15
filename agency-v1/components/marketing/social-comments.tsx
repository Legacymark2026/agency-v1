"use client";

import { useState, useEffect } from "react";
import { getSocialPostComments, createSocialPostComment } from "@/actions/social-publisher";
import { format } from "date-fns";
import { Send, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SocialComments({ postId, authorId }: { postId: string; authorId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        setIsLoading(true);
        const res = await getSocialPostComments(postId);
        if (res.success && res.data) {
            setComments(res.data);
        }
        setIsLoading(false);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setIsSaving(true);
        const res = await createSocialPostComment(postId, authorId, newComment);
        if (res.success && res.data) {
            setNewComment("");
            await loadComments();
        } else {
            toast.error(res.error || "Error al enviar comentario");
        }
        setIsSaving(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80">
                <h3 className="text-xs uppercase font-mono tracking-widest text-teal-400">Hilo de Colaboración</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-8">
                        No hay comentarios aún. ¡Inicia la conversación con el equipo!
                    </div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {c.user?.image ? (
                                    <img src={c.user.image} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={14} className="text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-200">{c.user?.name || "Usuario"}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{format(new Date(c.createdAt), 'MMM dd, HH:mm')}</span>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-r-lg rounded-bl-lg text-sm text-slate-300 shadow-sm">
                                    {c.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    placeholder="Menciona al diseñador, solicita cambios..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                />
                <Button 
                    size="icon" 
                    onClick={handleAddComment} 
                    disabled={isSaving || !newComment.trim()}
                    className="bg-teal-600 hover:bg-teal-500 text-white shrink-0"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                </Button>
            </div>
        </div>
    );
}
