"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Settings, User, Monitor, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const menuItems = [
        { icon: FileText, label: "Ver Portfolio", action: () => router.push("/portfolio") },
        { icon: User, label: "Nuestro Equipo", action: () => router.push("/nosotros") },
        { icon: Settings, label: "Servicios", action: () => router.push("/servicios") },
        { icon: Monitor, label: "Metodología", action: () => router.push("/metodologia") },
    ];

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
                >
                    <div className="flex items-center border-b border-gray-100 px-4">
                        <Search className="mr-2 h-5 w-5 text-gray-400" />
                        <input
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
                            placeholder="Escribe un comando o busca..."
                            autoFocus
                        />
                        <div className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                            <span>ESC</span>
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2">
                        <div className="mb-2 px-2 text-xs font-semibold text-gray-400">Sugerencias</div>
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => runCommand(item.action)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400 flex justify-between">
                        <span>Navegación rápida</span>
                        <span>LegacyMark OS v1.0</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
