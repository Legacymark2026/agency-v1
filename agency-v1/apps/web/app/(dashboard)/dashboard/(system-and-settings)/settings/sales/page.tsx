import { Metadata } from "next";
import Link from "next/link";
import { 
    ShoppingBag, TrendingUp, Layers, Settings, ArrowRight, ShieldCheck, 
    Sliders, CheckSquare, Zap, Target, DollarSign, Package
} from "lucide-react";

export const metadata: Metadata = {
    title: "Configuración de Ventas & Comercial | LegacyMark",
    description: "Parámetros del motor comercial, metas de ventas, reglas de comisiones y catálogo.",
};

export default function SalesSettingsPage() {
    const settingsCards = [
        {
            title: "Parámetros y Metas de Ventas",
            desc: "Define cuotas periódicas, metas por vendedor y seguimiento de objetivos comerciales.",
            href: "/dashboard/admin/sales/goals",
            icon: Target,
            badge: "Comercial",
            accent: "emerald"
        },
        {
            title: "Comisiones y Aceleradores",
            desc: "Configura escalas de comisiones, comisiones compartidas y reglas de pago para representantes.",
            href: "/dashboard/admin/crm/commissions",
            icon: DollarSign,
            badge: "Financiero",
            accent: "emerald"
        },
        {
            title: "Secuencias y Automatización Comercial",
            desc: "Flujos automatizados de prospección, seguimiento multicanal y cadencias de venta.",
            href: "/dashboard/admin/crm/sequences",
            icon: Zap,
            badge: "Automatización",
            accent: "teal"
        },
        {
            title: "Plantillas de Propuestas y Correos",
            desc: "Gestiona plantillas HTML, bloques de cotización estándar y firmas predeterminadas.",
            href: "/dashboard/admin/crm/templates",
            icon: Sliders,
            badge: "CPQ",
            accent: "teal"
        },
        {
            title: "Reglas de Asignación y Enrutamiento",
            desc: "Algoritmos de round-robin, asignación geográfica y enrutamiento por valor de oportunidad.",
            href: "/dashboard/admin/crm/assignment",
            icon: CheckSquare,
            badge: "Routing",
            accent: "blue"
        },
        {
            title: "Catálogo & Parámetros de Precios",
            desc: "Lista de precios, descuentos por volumen, SKU activos e impuestos comerciales.",
            href: "/dashboard/catalog",
            icon: Package,
            badge: "Catálogo",
            accent: "cyan"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        <span>Área Comercial</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-emerald-400 font-bold">Configuración de Ventas</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-7 h-7 text-emerald-400" />
                        Configuración del Motor de Ventas & CPQ
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        Ajusta parámetros de comisiones, políticas de asignación comercial, cuotas de rendimiento y catálogos de precios para tu fuerza de ventas.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Motor Activo
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
                            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all duration-200 shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                        {card.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
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
