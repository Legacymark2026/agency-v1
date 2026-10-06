"use client";

import { useState } from "react";
import { 
    Building2, ShieldCheck, Palette, Globe, Mail, 
    Settings2, Layers, CheckCircle2, ChevronRight
} from "lucide-react";
import { CompanyLegalProfileSettings } from "./company-legal-profile-settings";
import { DianInvoicingSettings } from "./dian-invoicing-settings";
import { WhiteLabelingSettings } from "./white-labeling-settings";
import { DefaultCompanySettings } from "./default-company-settings";
import { GlobalEmailTemplates } from "./global-email-templates";
import { CustomDomainSettings } from "./custom-domain-settings";

interface CompanyHubClientProps {
    companyData: any;
    emailTemplates: any[];
}

type CompanyTab = 'profile' | 'dian' | 'branding' | 'domain' | 'regional' | 'templates';

export function CompanySettingsHubClient({ companyData, emailTemplates }: CompanyHubClientProps) {
    const [activeTab, setActiveTab] = useState<CompanyTab>('profile');

    const tabs: { id: CompanyTab; label: string; icon: any; badge?: string; desc: string }[] = [
        {
            id: 'profile',
            label: 'Identidad & RUT Fiscal',
            icon: Building2,
            badge: 'UBL 2.1',
            desc: 'Razón social, NIT/DV, CIIU, régimen y dirección legal'
        },
        {
            id: 'branding',
            label: 'Marca Blanca & Logos',
            icon: Palette,
            desc: 'Logotipo corporativo, colores y paleta de la interfaz'
        },
        {
            id: 'domain',
            label: 'Dominio Propio (CNAME)',
            icon: Globe,
            badge: 'SSL Auto',
            desc: 'Acceso a la plataforma bajo tu propio subdominio'
        },
        {
            id: 'dian',
            label: 'Habilitación DIAN SaaS',
            icon: ShieldCheck,
            badge: 'Producción',
            desc: 'Certificado digital .p12, TestSetID y llaves técnicas'
        },
        {
            id: 'regional',
            label: 'Parámetros Regionales',
            icon: Settings2,
            desc: 'Moneda base (COP/USD), zona horaria e idioma'
        },
        {
            id: 'templates',
            label: 'Plantillas de Correo',
            icon: Mail,
            desc: 'Mensajería transaccional para clientes y propuestas'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-16">
            {/* Header con resumen corporativo */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            Gobernanza Empresarial
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Tenant Activo
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        {companyData?.name || "LEGACYMARK S.A.S."}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                        Gestiona la razón social, datos tributarios DIAN, personalización de marca blanca, dominios CNAME y parámetros globales de tu compañía.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Plan de Suscripción</span>
                        <span className="text-xs font-bold text-teal-400 font-mono uppercase">
                            {companyData?.subscriptionTier || "ENTERPRISE"} (Tier-1)
                        </span>
                    </div>
                </div>
            </div>

            {/* Pestañas de Navegación Segmentada */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center text-center p-3 rounded-xl transition-all relative ${
                                isActive 
                                    ? "bg-slate-900 text-white border border-teal-500/30 shadow-md shadow-teal-500/10" 
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                            }`}
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                                {tab.badge && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        isActive ? "bg-teal-500/20 text-teal-300" : "bg-slate-800 text-slate-400"
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-bold leading-tight line-clamp-1">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Content Panel by Subtab */}
            <div className="pt-2">
                {activeTab === 'profile' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-teal-400" />
                                <div>
                                    <h4 className="text-sm font-bold text-white">Identidad Jurídica y Domicilio Fiscal</h4>
                                    <p className="text-xs text-slate-400">Datos sincronizados con la resolución de facturación y el Registro Único Tributario (RUT).</p>
                                </div>
                            </div>
                        </div>
                        <CompanyLegalProfileSettings initialData={companyData} />
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <WhiteLabelingSettings initialData={companyData} />
                    </div>
                )}

                {activeTab === 'domain' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <CustomDomainSettings initialData={companyData} />
                    </div>
                )}

                {activeTab === 'dian' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <DianInvoicingSettings initialConfig={companyData?.defaultSettings} />
                    </div>
                )}

                {activeTab === 'regional' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <DefaultCompanySettings initialData={companyData?.defaultSettings} />
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <GlobalEmailTemplates initialTemplates={emailTemplates} companyId={companyData?.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
