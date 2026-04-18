"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasClosed, setHasClosed] = useState(false);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasClosed) {
                setIsVisible(true);
            }
        };

        const timer = setTimeout(() => {
            if (!hasClosed) setIsVisible(true);
        }, 15000); // Show after 15s if no exit intent

        document.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave);
            clearTimeout(timer);
        };
    }, [hasClosed]);

    const handleClose = () => {
        setIsVisible(false);
        setHasClosed(true);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-black"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-6">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No te vayas con las manos vacías</h3>
                            <p className="text-gray-600 mb-6">
                                Recibe nuestra guía exclusiva "5 Estrategias de Growth para 2026" directamente en tu email.
                            </p>

                            <div className="flex gap-2">
                                <Input placeholder="Tu correo corporativo" className="flex-1" />
                                <Button className="bg-blue-600 hover:bg-blue-700">Enviar Guía</Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-4">Libre de spam. Desuscríbete cuando quieras.</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
