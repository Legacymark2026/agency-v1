'use client';

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-0">
            <div
                ref={overlayRef}
                className="relative w-full max-w-md bg-white p-6 shadow-xl rounded-xl border border-gray-200 animate-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X size={18} />
                    </Button>
                </div>

                {description && <p className="text-gray-500 mb-6">{description}</p>}

                {children}

                <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={onClose}>Entendido</Button>
                </div>
            </div>
        </div>
    );
}
