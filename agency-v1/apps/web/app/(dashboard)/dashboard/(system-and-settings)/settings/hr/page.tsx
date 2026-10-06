import { Metadata } from "next";
import Link from "next/link";
import { 
    Users, DollarSign, CreditCard, Activity, Settings, ArrowRight, ShieldCheck, 
    Calendar, FileSpreadsheet, UserCheck, Shield, Clock, Award
} from "lucide-react";

export const metadata: Metadata = {
    title: "Configuración de Talento Humano & RRHH | LegacyMark",
    description: "Parámetros de nómina, PILA, políticas de vacaciones, contratistas y organigrama.",
};

export default function HRSettingsPage() {
    const settingsCards = [
        {
            title: "Parámetros de Nómina Electrónica & PILA",
            desc: "Conceptos salariales, devengados, deducciones de ley y rangos de liquidación DIAN.",
            href: "/dashboard/admin/payroll",
            icon: DollarSign,
            badge: "Nómina",
        },
        {
            title: "Tipos de Contrato y Colaboradores",
            desc: "Estructura de contratos a término fijo, indefinido, prestación de servicios y aprendices.",
            href: "/dashboard/admin/payroll/employees",
            icon: Users,
            badge: "Personal",
        },
        {
            title: "Políticas de Vacaciones, Permisos y Novedades",
            desc: "Reglas de acumulación, días hábiles de descanso, incapacidades y aprobaciones de ausencias.",
            href: "/dashboard/admin/hr",
            icon: Calendar,
            badge: "Novedades",
        },
        {
            title: "Políticas de Gastos y Viáticos",
            desc: "Límites de viáticos reembolsables, categorías de egresos de personal y flujo de visto bueno.",
            href: "/dashboard/admin/payroll/expenses",
            icon: CreditCard,
            badge: "Egresos",
        },
        {
            title: "Estructura de Cargos, Roles y Permisos",
            desc: "Asignación de perfiles de acceso empresarial y niveles jerárquicos de supervisión.",
            href: "/dashboard/settings/roles",
            icon: Shield,
            badge: "RBAC",
        },
        {
            title: "Certificados y Reportes Laborales",
            desc: "Plantillas de certificados de ingresos y retenciones, desprendibles de pago y paz y salvos.",
            href: "/dashboard/admin/payroll/reports",
            icon: FileSpreadsheet,
            badge: "Documental",
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        <span>Área de Talento Humano</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-indigo-400 font-bold">Configuración de RRHH</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-7 h-7 text-indigo-400" />
                        Configuración de Talento Humano & Nómina
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        Establece los parámetros laborales de tu organización, reglas de liquidación DIAN PILA, políticas de vacaciones y matriz de personal.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Motor Laboral Activo
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
                            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all duration-200 shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                        {card.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
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
