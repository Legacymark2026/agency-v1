"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    Search, User, MessageSquare, Hash, Target,
    Phone, Mail, MapPin, Tag, Briefcase, Filter, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function InboxCommandMenu() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const navigateToConversation = (id: string) => {
        setOpen(false);
        router.push(`/dashboard/inbox/${id}`);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
            <div className="w-full max-w-xl mx-auto px-4">
                <Command
                    className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
                    label="Command Menu"
                >
                    <div className="flex items-center border-b border-slate-100 px-4">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <Command.Input
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            placeholder="Buscar chats, leads o tags..."
                            className="flex-1 h-14 bg-transparent border-none outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400 px-3 text-base"
                            autoFocus
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-500">
                            ESC
                        </kbd>
                        <button onClick={() => setOpen(false)} className="sm:hidden -mr-2 p-2 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-hide">
                        <Command.Empty className="py-12 px-4 text-center text-sm text-slate-500">
                            No se encontraron resultados para "{searchQuery}"
                        </Command.Empty>

                        {searchQuery.length === 0 && (
                            <Command.Group heading="Chats Recientes" className="px-2 text-xs font-semibold text-slate-500 py-2">
                                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                                    Escribe para buscar conversaciones...
                                </div>
                            </Command.Group>
                        )}

                        <Command.Group heading="Filtros y Vistas" className="px-2 text-xs font-semibold text-slate-500 py-2">
                            <Command.Item onSelect={() => { setOpen(false); router.push('/dashboard/inbox?folder=mine'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 aria-selected:bg-slate-100 text-sm text-slate-700">
                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                Ir a <strong>Mis Chats</strong>
                            </Command.Item>
                            <Command.Item onSelect={() => { setOpen(false); router.push('/dashboard/inbox?folder=unassigned'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 aria-selected:bg-slate-100 text-sm text-slate-700">
                                <User className="w-4 h-4 text-slate-400" />
                                Chats <strong>Sin Asignar</strong>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Etiquetas" className="px-2 text-xs font-semibold text-slate-500 py-2">
                            <Command.Item onSelect={() => { }} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 aria-selected:bg-slate-100 text-sm text-slate-700">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                Filtrar por #Soporte-VIP
                            </Command.Item>
                            <Command.Item onSelect={() => { }} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 aria-selected:bg-slate-100 text-sm text-slate-700">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                Filtrar por #Ventas
                            </Command.Item>
                        </Command.Group>

                    </Command.List>

                    <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <kbd className="font-mono bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center shadow-sm">↑</kbd>
                                <kbd className="font-mono bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center shadow-sm">↓</kbd>
                                <span>Navegar</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <kbd className="font-mono bg-white border border-slate-200 rounded px-1.5 shadow-sm">Enter</kbd>
                                <span>Seleccionar</span>
                            </div>
                        </div>
                    </div>
                </Command>
            </div>
        </div>
    );
}
