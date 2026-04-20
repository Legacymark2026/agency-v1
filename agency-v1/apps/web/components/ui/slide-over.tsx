"use client";

import { useState, useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface SlideOverProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
    width?: "sm" | "md" | "lg";
}

/**
 * Professional slide-over drawer panel.
 * Slides from the right side of the screen with a backdrop.
 */
export function SlideOver({ open, onClose, title, subtitle, children, width = "md" }: SlideOverProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
            const timeout = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [open]);

    if (!mounted) return null;

    const widthMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

    return (
        <div className="fixed inset-0 z-[60] flex">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
            />

            {/* Panel */}
            <div
                className={`absolute right-0 top-0 h-full w-full ${widthMap[width]} bg-[#0d1117] border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-slate-100">{title}</h2>
                        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content — scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
}

export function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel = "Confirmar", danger = false }: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div onClick={onCancel} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-100">{title}</h3>
                <p className="text-sm text-slate-400">{message}</p>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            danger
                                ? "bg-red-600 hover:bg-red-500 text-white"
                                : "bg-teal-500 hover:bg-teal-400 text-slate-950"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
