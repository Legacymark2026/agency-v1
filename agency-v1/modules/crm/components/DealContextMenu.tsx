"use client"

import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Mail, Phone, Copy, CopyPlus, Archive, MoreVertical, UserCheck, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { assignDeal } from "@/actions/crm-closing"
import Link from "next/link"
import { WhatsAppTemplatesModal } from "@/components/crm/WhatsAppTemplates"

type User = { id: string; name: string | null; email: string | null; image?: string | null };

interface DealContextMenuProps {
    children: React.ReactNode
    deal: any
    onEdit: () => void
    onDelete: () => void
    onDuplicate?: () => void
    onArchive?: () => void
    users?: User[]
    onAssigned?: (dealId: string, userId: string | null) => void
}

export function DealContextMenu({ children, deal, onEdit, onDelete, onDuplicate, onArchive, users = [], onAssigned }: DealContextMenuProps) {
    const [isWaOpen, setIsWaOpen] = useState(false);

    const handleCopyEmail = () => {
        if (deal.contactEmail) {
            navigator.clipboard.writeText(deal.contactEmail)
            toast.success("Email copiado al portapapeles")
        } else {
            toast.error("No hay correo para copiar")
        }
    }

    const handleAssign = async (userId: string | null) => {
        const res = await assignDeal(deal.id, userId);
        if (res.success) {
            const user = users.find(u => u.id === userId);
            toast.success(userId ? `Asignado a ${user?.name ?? userId}` : "Asignación removida");
            onAssigned?.(deal.id, userId);
        } else {
            toast.error("Error al asignar vendedor");
        }
    };

    const handleDuplicate = () => {
        if (onDuplicate) {
            onDuplicate()
        } else {
            toast.error("Función duplicar no disponible")
        }
    }

    return (
        <div className="relative group/context w-full h-full">
            {children}
            <div className="absolute top-3 right-4 opacity-0 group-hover/context:opacity-100 transition-opacity z-20">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-1.5 flex items-center justify-center bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm hover:bg-white text-gray-400 hover:text-gray-800 transition-all hover:scale-110 active:scale-95 z-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    {/* Usamos Portal para sacar el menú del flujo de dnd-kit */}
                    <DropdownMenuPortal>
                        <DropdownMenuContent
                            className="w-60 p-2 bg-white/95 backdrop-blur-xl border border-gray-100/60 shadow-[0_12px_45px_-12px_rgba(0,0,0,0.15)] rounded-2xl animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-4 z-[9999]"
                            align="end"
                            sideOffset={6}
                        >
                            <DropdownMenuItem asChild>
                                <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-blue-50 focus:bg-blue-50 text-gray-700 font-medium"
                                >
                                    <div className="p-1.5 rounded-md bg-blue-100/50 text-blue-600 group-hover:scale-110 transition-transform">
                                        <Edit className="h-3.5 w-3.5" />
                                    </div>
                                    Editar Oportunidad
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 font-medium mt-1"
                                >
                                    <div className="p-1.5 rounded-md bg-emerald-100/50 text-emerald-600 group-hover:scale-110 transition-transform">
                                        <CopyPlus className="h-3.5 w-3.5" />
                                    </div>
                                    Duplicar Negocio
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleCopyEmail(); }}
                                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-gray-100 focus:bg-gray-100 text-gray-700 font-medium mt-1"
                                >
                                    <div className="p-1.5 rounded-md bg-gray-200/50 text-gray-600 group-hover:scale-110 transition-transform">
                                        <Copy className="h-3.5 w-3.5" />
                                    </div>
                                    Copiar Email
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-gray-100/80" />

                            {/* Assign Salesperson Submenu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-violet-50 text-gray-700 font-medium mt-1 w-full"
                                >
                                    <div className="p-1.5 rounded-md bg-violet-100/50 text-violet-600">
                                        <UserCheck className="h-3.5 w-3.5" />
                                    </div>
                                    Asignar Vendedor
                                    {deal.assignedUser?.name && <span className="ml-auto text-xs text-gray-400 truncate max-w-[70px]">{deal.assignedUser.name}</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="w-52 p-2 bg-white/95 backdrop-blur-xl border border-gray-100/60 shadow-lg rounded-xl z-[9999]">
                                        <DropdownMenuItem asChild>
                                            <div onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation(); handleAssign(null);}}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-500 text-sm font-medium">
                                                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">—</span>
                                                Sin asignar
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                        {users.length === 0 ? (
                                            <p className="text-xs text-gray-400 px-3 py-2 text-center">Sin usuarios cargados</p>
                                        ) : users.map(u => (
                                            <DropdownMenuItem key={u.id} asChild>
                                                <div onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation(); handleAssign(u.id);}}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-violet-50 text-sm font-medium transition-colors ${deal.assignedTo === u.id ? 'bg-violet-50 text-violet-700' : 'text-gray-700'}`}>
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}>
                                                        {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                                                    </div>
                                                    <span className="flex-1 truncate">{u.name ?? u.email}</span>
                                                    {deal.assignedTo === u.id && <span className="text-violet-600 text-xs">✓</span>}
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            {/* Ver Detalle del Deal */}
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/admin/crm/deals/${deal.id}`}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-sky-50 focus:bg-sky-50 text-gray-700 font-medium mt-1">
                                    <div className="p-1.5 rounded-md bg-sky-100/50 text-sky-600 group-hover:scale-110 transition-transform">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </div>
                                    Ver Detalle
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-gray-100/80" />

                            {deal.contactEmail && (
                                <DropdownMenuItem asChild>
                                    <a
                                        href={`mailto:${deal.contactEmail}`}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 font-medium"
                                    >
                                        <div className="p-1.5 rounded-md bg-indigo-100/50 text-indigo-600 group-hover:scale-110 transition-transform">
                                            <Mail className="h-3.5 w-3.5" />
                                        </div>
                                        Enviar Correo
                                    </a>
                                </DropdownMenuItem>
                            )}

                            {deal.contactPhone && (
                                <DropdownMenuItem asChild>
                                    <div
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => { e.stopPropagation(); setIsWaOpen(true); }}
                                        className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-emerald-50 focus:bg-emerald-50 text-gray-700 font-medium mt-1"
                                    >
                                        <div className="p-1.5 rounded-md bg-emerald-100/50 text-emerald-600 group-hover:scale-110 transition-transform">
                                            <Phone className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-emerald-700">Enviar WhatsApp</span>
                                    </div>
                                </DropdownMenuItem>
                            )}

                            {onArchive && (
                                <>
                                    <DropdownMenuSeparator className="my-1.5 bg-gray-100/80" />
                                    <DropdownMenuItem asChild>
                                        <div
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => { e.stopPropagation(); onArchive(); }}
                                            className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-amber-50 focus:bg-amber-50 text-amber-700 font-medium"
                                        >
                                            <div className="p-1.5 rounded-md bg-amber-100/50 text-amber-600 group-hover:scale-110 transition-transform">
                                                <Archive className="h-3.5 w-3.5" />
                                            </div>
                                            Archivar Deal
                                        </div>
                                    </DropdownMenuItem>
                                </>
                            )}

                            <DropdownMenuSeparator className="my-1.5 bg-gray-100/80" />

                            <DropdownMenuItem asChild>
                                <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-red-50 focus:bg-red-50 text-red-700 font-medium"
                                >
                                    <div className="p-1.5 rounded-md bg-red-100/50 text-red-600 group-hover:scale-110 transition-transform">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-bold">Eliminar Definitivamente</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenu>
            </div>
            
            <WhatsAppTemplatesModal 
                open={isWaOpen} 
                onOpenChange={setIsWaOpen} 
                contactPhone={deal.contactPhone}
                contactName={deal.contactName}
                dealTitle={deal.title}
            />
        </div>
    )
}
