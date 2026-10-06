import { Metadata } from "next";
import Link from "next/link";
import { 
    Boxes, Building2, Calendar, Trello, Settings, ArrowRight, ShieldCheck, 
    Layers, Truck, Clock, Sliders, Briefcase
} from "lucide-react";

export const metadata: Metadata = {
    title: "Configuración de Operaciones & Logística | LegacyMark",
    description: "Parámetros de almacenes, bodegas, logística omnicanal y gestión de turnos.",
};

export default function OperationsSettingsPage() {
    const settingsCards = [
        {
            title: "Bodegas y Puntos de Almacenamiento",
            desc: "Administra múltiples ubicaciones, stock de seguridad y alertas de reposición.",
            href: "/dashboard/inventory",
            icon: Boxes,
            badge: "Inventario",
        },
        {
            title: "Canales de Despacho y Logística",
            desc: "Configura transportadoras aliadas, tiempos de entrega y cobertura geográfica.",
            href: "/dashboard/channels",
            icon: Truck,
            badge: "Omnicanal",
        },
        {
            title: "Políticas de Agendamiento y Citas",
            desc: "Horarios hábiles, ventanas de reserva, duraciones por servicio y enlaces de reunión.",
            href: "/dashboard/booking",
            icon: Clock,
            badge: "Citas",
        },
        {
            title: "Tableros Operativos y Estados Kanban",
            desc: "Personaliza columnas de trabajo, SLA de resolución por tarjeta y prioridades.",
            href: "/dashboard/kanban",
            icon: Trello,
            badge: "Flujos",
        },
        {
            title: "Proyectos y Gobernanza de Entregables",
            desc: "Plantillas de proyecto, hitos predeterminados y roles asignados por portafolio.",
            href: "/dashboard/projects",
            icon: Briefcase,
            badge: "Portafolio",
        },
        {
            title: "Automatización de Tareas Operativas",
            desc: "Conexión de workflows automáticos para despacho, notificación y cierre de tickets.",
            href: "/dashboard/admin/automation",
            icon: Sliders,
            badge: "Workflows",
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        <span>Área de Operaciones</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-blue-400 font-bold">Configuración Operativa</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-7 h-7 text-blue-400" />
                        Configuración de Operaciones & Logística
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        Ajusta parámetros de inventario, reglas de logística multicanal, políticas de reservas y tableros operativos de ejecución.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Motor Operativo
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {settingsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-900/90 transition-all duration-200 shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                        {card.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                                <span>Administrar regla</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
