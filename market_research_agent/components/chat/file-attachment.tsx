"use client";

import { useState, useRef, useCallback } from "react";
import { Paperclip, X, File, Image as ImageIcon, FileText, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileAttachmentProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
}

const FILE_TYPE_ICONS = {
    image: ImageIcon,
    video: Film,
    document: FileText,
    other: File,
};

function getFileType(file: File): "image" | "video" | "document" | "other" {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("application/pdf") || file.type.startsWith("application/msword") || 
        file.type.startsWith("application/vnd.") || file.type.startsWith("text/")) return "document";
    return "other";
}

interface Attachment {
    id: string;
    file: File;
    preview?: string;
    type: "image" | "video" | "document" | "other";
}

export function FileAttachmentButton({ onFilesSelected, maxFiles = 5, maxSizeMB = 10 }: FileAttachmentProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList | File[]) => {
        const newFiles = Array.from(files).slice(0, maxFiles - attachments.length);
        
        const newAttachments: Attachment[] = newFiles.map(file => {
            const type = getFileType(file);
            const attachment: Attachment = { id: crypto.randomUUID(), file, type };
            
            if (type === "image") {
                attachment.preview = URL.createObjectURL(file);
            }
            return attachment;
        });

        setAttachments(prev => [...prev, ...newAttachments].slice(0, maxFiles));
        onFilesSelected(newFiles.map(a => a.file));
    }, [attachments.length, maxFiles, onFilesSelected]);

    const removeAttachment = (id: string) => {
        setAttachments(prev => {
            const att = prev.find(a => a.id === id);
            if (att?.preview) URL.revokeObjectURL(att.preview);
            return prev.filter(a => a.id !== id);
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-teal-500 transition-colors"
            >
                <Paperclip className="h-4 w-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden z-50"
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <div className={cn(
                            "p-4 border-2 border-dashed m-2 rounded-xl transition-all text-center",
                            isDragging 
                                ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30" 
                                : "border-zinc-200 dark:border-zinc-700"
                        )}>
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            />
                            <label className="cursor-pointer block">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2.5 bg-teal-100 dark:bg-teal-900/50 rounded-xl">
                                        <Paperclip className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                            Subir archivo
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Máx {maxSizeMB}MB • {maxFiles} archivos
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {attachments.length > 0 && (
                            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 max-h-36 overflow-y-auto">
                                {attachments.map(att => {
                                    const Icon = FILE_TYPE_ICONS[att.type];
                                    return (
                                        <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 group">
                                            {att.preview ? (
                                                <img src={att.preview} alt={att.file.name} className="h-9 w-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                                            ) : (
                                                <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                                    <Icon className="h-4 w-4 text-zinc-500" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{att.file.name}</p>
                                                <p className="text-[10px] text-zinc-400">{(att.file.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                            <button onClick={() => removeAttachment(att.id)} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all">
                                                <X className="h-3.5 w-3.5 text-red-500" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}