"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { 
    Search, FileText, Users, DollarSign, Settings, Box, LayoutDashboard,
    MessageSquare, Briefcase, Zap, Terminal, Command as CommandIcon, Building2
} from "lucide-react";

export function GlobalCommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Toggle the menu when ⌘K or Ctrl+K is pressed
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

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <Command 
                    className="w-full"
                    loop
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setOpen(false);
                    }}
                >
                    <div className="flex items-center border-b border-slate-800 px-4">
                        <Search className="text-slate-400 w-5 h-5 mr-2" />
                        <Command.Input 
                            autoFocus
                            placeholder="¿Qué necesitas hacer? Escribe un comando o busca algo..." 
                            className="flex-1 h-14 bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none text-lg"
                        />
                        <div className="flex gap-1 text-xs text-slate-500 font-mono">
                            <span className="px-1.5 py-0.5 bg-slate-800 rounded">ESC</span>
                            <span>para salir</span>
                        </div>
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
                        <Command.Empty className="py-12 text-center text-sm text-slate-400">
                            No se encontraron comandos o resultados.
                        </Command.Empty>

                        <Command.Group heading="Acciones Rápidas (IA)" className="text-xs font-semibold text-emerald-400 px-2 py-3">
                            <Command.Item 
                                onSelect={() => runCommand(() => router.push('/dashboard/accounting/costs'))}
                                className="flex items-center px-3 py-3 mt-1 text-sm text-slate-200 rounded-lg cursor-pointer hover:bg-slate-800 hover:text-emerald-300 transition-colors aria-selected:bg-slate-800 aria-selected:text-emerald-300"
                            >
                                <DollarSign className="w-4 h-4 mr-3" />
                                <span className="flex-1">Registrar un nuevo <strong>Costo / Gasto</strong></span>
                                <span className="text-xs text-slate-500">Finanzas</span>
                            </Command.Item>
                            
                            <Command.Item 
                                onSelect={() => runCommand(() => router.push('/dashboard/admin/sales'))}
                                className="flex items-center px-3 py-3 text-sm text-slate-200 rounded-lg cursor-pointer hover:bg-slate-800 hover:text-emerald-300 transition-colors aria-selected:bg-slate-800 aria-selected:text-emerald-300"
                            >
                                <FileText className="w-4 h-4 mr-3" />
                                <span className="flex-1">Generar una nueva <strong>Cotización (CPQ)</strong></span>
                                <span className="text-xs text-slate-500">Ventas</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Módulos Enterprise" className="text-xs font-semibold text-slate-500 px-2 py-3 border-t border-slate-800 mt-2">
                            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard/admin/crm'))} className="flex items-center px-3 py-2 text-sm text-slate-300 rounded-lg cursor-pointer aria-selected:bg-slate-800">
                                <Users className="w-4 h-4 mr-3 text-blue-400" />
                                <span>CRM & Pipeline</span>
                            </Command.Item>
                            
                            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard/inbox'))} className="flex items-center px-3 py-2 text-sm text-slate-300 rounded-lg cursor-pointer aria-selected:bg-slate-800">
                                <MessageSquare className="w-4 h-4 mr-3 text-violet-400" />
                                <span>Inbox Omnicanal</span>
                            </Command.Item>
                            
                            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard/inventory'))} className="flex items-center px-3 py-2 text-sm text-slate-300 rounded-lg cursor-pointer aria-selected:bg-slate-800">
                                <Box className="w-4 h-4 mr-3 text-amber-400" />
                                <span>Inventario & Logística</span>
                            </Command.Item>

                            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard/suppliers'))} className="flex items-center px-3 py-2 text-sm text-slate-300 rounded-lg cursor-pointer aria-selected:bg-slate-800">
                                <Building2 className="w-4 h-4 mr-3 text-teal-400" />
                                <span>Proveedores & Homologación (SRM)</span>
                            </Command.Item>

                            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard/tools/master-hub'))} className="flex items-center px-3 py-2 text-sm text-slate-300 rounded-lg cursor-pointer aria-selected:bg-slate-800">
                                <Terminal className="w-4 h-4 mr-3 text-cyan-400" />
                                <span>Consola IA & Agentes</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
            
            {/* Overlay to close when clicking outside */}
            <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
    );
}
