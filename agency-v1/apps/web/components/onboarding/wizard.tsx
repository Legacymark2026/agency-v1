'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  Zap, 
  X, 
  Building2, 
  Coins, 
  PhoneCall, 
  ShieldCheck 
} from "lucide-react";
import { completeOnboardingAndCloneTemplates, saveGuidedOnboardingProfile } from "@/actions/onboarding";
import { toast } from "sonner";

interface OnboardingWizardProps {
    initialShow: boolean;
}

export function OnboardingWizard({ initialShow }: OnboardingWizardProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [cloning, setCloning] = useState(false);

    // Formulario de Onboarding Guiado (Fase 2)
    const [whatsappPhone, setWhatsappPhone] = useState("");
    const [taxId, setTaxId] = useState("");
    const [taxRegime, setTaxRegime] = useState("no_responsable_iva");
    const [baseCurrency, setBaseCurrency] = useState("COP");

    useEffect(() => {
        if (initialShow) {
            const dismissed = sessionStorage.getItem("onboarding_dismissed");
            if (!dismissed) {
                const t = setTimeout(() => setOpen(true), 1200);
                return () => clearTimeout(t);
            }
        }
    }, [initialShow]);

    const handleDismiss = () => {
        sessionStorage.setItem("onboarding_dismissed", "true");
        setOpen(false);
    };

    const handleSaveProfile = async (nextStep: number) => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("whatsappPhone", whatsappPhone);
            formData.append("taxId", taxId);
            formData.append("taxRegime", taxRegime);
            formData.append("baseCurrency", baseCurrency);

            const res = await saveGuidedOnboardingProfile(formData);
            if (res.success) {
                toast.success("Información empresarial guardada");
                setStep(nextStep);
            } else {
                toast.error(typeof (res as any).message === "string" ? (res as any).message : "Error al guardar perfil");
            }
        } catch {
            toast.error("Error al procesar la solicitud");
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        setCloning(true);
        try {
            // Asegurar que los datos del perfil queden persistidos
            const formData = new FormData();
            formData.append("whatsappPhone", whatsappPhone);
            formData.append("taxId", taxId);
            formData.append("taxRegime", taxRegime);
            formData.append("baseCurrency", baseCurrency);
            await saveGuidedOnboardingProfile(formData).catch(() => {});

            const res = await completeOnboardingAndCloneTemplates();
            if (res.success) {
                toast.success("¡Espacio de trabajo listo para operar!");
                sessionStorage.setItem("onboarding_dismissed", "true");
                setOpen(false);
            } else {
                toast.error(res.error || "Error al completar el onboarding");
            }
        } catch {
            toast.error("Error inesperado al inicializar");
        } finally {
            setCloning(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleDismiss(); }}>
            <DialogContent className="w-[95vw] sm:max-w-[700px] p-0 overflow-hidden bg-slate-950 border-slate-800 text-white shadow-2xl relative max-h-[90vh] flex flex-col">
                {/* Botón de Cierre */}
                <button 
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 z-50 text-slate-400 hover:text-white p-1 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all"
                    title="Cerrar guía"
                >
                    <X size={15} />
                </button>

                <div className="sr-only">
                    <DialogHeader>
                        <DialogTitle>Onboarding Guiado de Empresa</DialogTitle>
                        <DialogDescription>
                            Configuración de datos fiscales, canales de notificación y motores de automatización.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Barra de Progreso */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 z-30">
                    <div 
                        className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 transition-all duration-500" 
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
                    {/* Barra Lateral Izquierda (Desktop) */}
                    <div className="w-full md:w-[240px] shrink-0 bg-slate-900/50 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-slate-800/60 hidden md:flex md:flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] uppercase tracking-widest text-teal-400 font-mono font-semibold">Paso a Paso</span>
                            </div>
                            <h2 className="text-base font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                                Activación de tu Espacio
                            </h2>
                            <div className="space-y-5">
                                <StepIndicator current={step} number={1} title="Notificaciones & IA" icon={<MessageSquare className="w-3.5 h-3.5" />} />
                                <StepIndicator current={step} number={2} title="Datos Fiscales & Moneda" icon={<Building2 className="w-3.5 h-3.5" />} />
                                <StepIndicator current={step} number={3} title="Despliegue de Motores" icon={<Zap className="w-3.5 h-3.5" />} />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-800/40 text-[10px] text-slate-500 font-mono">
                            LegacyMark Engine v2.0
                        </div>
                    </div>

                    {/* Stepper Móvil Compacto */}
                    <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 text-xs">
                        <span className="text-[11px] font-medium text-teal-400 font-mono">Paso {step} de 3</span>
                        <span className="text-[11px] text-slate-300 font-semibold truncate max-w-[200px]">
                            {step === 1 ? "Notificaciones" : step === 2 ? "Datos Fiscales" : "Activación"}
                        </span>
                    </div>

                    {/* Contenido Derecho con Scrollbar interno */}
                    <div className="flex-1 p-5 sm:p-7 overflow-y-auto min-h-0 space-y-4">
                        {/* PASO 1: Notificaciones WhatsApp & Agentes */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">WhatsApp de Operaciones & IA</h3>
                                    <p className="text-slate-400 mt-1 text-xs leading-relaxed">
                                        Número principal para recibir alertas automáticas de ventas POS, avisos de facturas emitidas y comunicación con los agentes de IA de LegacyMark.
                                    </p>
                                </div>

                                <div className="space-y-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="whatsapp" className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                                            WhatsApp Corporativo (con código de país)
                                        </Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="whatsapp"
                                                type="tel"
                                                placeholder="+57 300 123 4567"
                                                value={whatsappPhone}
                                                onChange={(e) => setWhatsappPhone(e.target.value)}
                                                className="pl-10 bg-slate-950 border-slate-800 text-slate-200 text-sm h-9 focus-visible:ring-teal-500"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            * Opcional: puedes configurarlo o cambiarlo luego en Ajustes.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <Button variant="ghost" onClick={handleDismiss} className="text-slate-400 text-xs">
                                        Configurar más tarde
                                    </Button>
                                    <Button 
                                        onClick={() => handleSaveProfile(2)} 
                                        disabled={saving}
                                        className="bg-teal-600 hover:bg-teal-500 text-white text-xs gap-2 h-9 px-4"
                                    >
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Siguiente Paso"}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: Datos Fiscales (NIT / Régimen) & Moneda */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Coins className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Estructuración Fiscal & Moneda</h3>
                                    <p className="text-slate-400 mt-1 text-xs leading-relaxed">
                                        Parámetros necesarios para habilitar la facturación electrónica DIAN y sincronizar pasarelas de pago (Bold / Stripe).
                                    </p>
                                </div>

                                <div className="space-y-3.5 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                                    {/* NIT / Tax ID */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="taxId" className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                                            NIT / Identificación Fiscal (con Dígito)
                                        </Label>
                                        <Input
                                            id="taxId"
                                            placeholder="901.234.567-8"
                                            value={taxId}
                                            onChange={(e) => setTaxId(e.target.value)}
                                            className="bg-slate-950 border-slate-800 text-slate-200 text-sm h-9 focus-visible:ring-teal-500"
                                        />
                                    </div>

                                    {/* Régimen Tributario */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="taxRegime" className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                                            Régimen Tributario
                                        </Label>
                                        <select
                                            id="taxRegime"
                                            value={taxRegime}
                                            onChange={(e) => setTaxRegime(e.target.value)}
                                            className="w-full h-9 rounded-md px-3 text-xs bg-slate-950 border border-slate-800 text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                        >
                                            <option value="no_responsable_iva">No Responsable de IVA</option>
                                            <option value="responsable_iva">Responsable de IVA (Régimen Común)</option>
                                            <option value="simple_tributacion">Régimen Simple de Tributación (RST)</option>
                                        </select>
                                    </div>

                                    {/* Moneda Base */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="baseCurrency" className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                                            Moneda Base de Transacción
                                        </Label>
                                        <select
                                            id="baseCurrency"
                                            value={baseCurrency}
                                            onChange={(e) => setBaseCurrency(e.target.value)}
                                            className="w-full h-9 rounded-md px-3 text-xs bg-slate-950 border border-slate-800 text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                        >
                                            <option value="COP">🇨🇴 COP ($) — Peso Colombiano</option>
                                            <option value="USD">🇺🇸 USD ($) — Dólar Americano</option>
                                            <option value="EUR">🇪🇺 EUR (€) — Euro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 text-xs">
                                        Atrás
                                    </Button>
                                    <Button 
                                        onClick={() => handleSaveProfile(3)} 
                                        disabled={saving}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2 h-9 px-4"
                                    >
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Siguiente Paso"}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* PASO 3: Aprovisionamiento de Plantillas & Agentes IA */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4 flex flex-col items-center justify-center text-center py-6 min-h-[260px]">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 p-0.5 animate-pulse">
                                        <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                                            <ShieldCheck className="w-6 h-6 text-teal-400" />
                                        </div>
                                    </div>
                                    {cloning && (
                                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                                            <Loader2 className="w-3 h-3 text-teal-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Motores Listos para Operar</h3>
                                    <p className="text-slate-400 mt-1.5 text-xs leading-relaxed max-w-sm mx-auto">
                                        Se han estructurado los permisos RBAC, compuertas de seguridad y flujos de automatización para tu espacio.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleComplete} 
                                    disabled={cloning}
                                    className="bg-white text-black hover:bg-slate-200 text-xs font-semibold gap-2 w-full max-w-xs h-9 mt-2 shadow-xl"
                                >
                                    {cloning ? "Sincronizando Motores..." : "Entrar a mi Dashboard"}
                                    {!cloning && <CheckCircle2 className="w-4 h-4" />}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StepIndicator({ current, number, title, icon }: { current: number, number: number, title: string, icon: React.ReactNode }) {
    const isActive = current === number;
    const isPast = current > number;
    
    return (
        <div className={`flex items-center gap-3.5 transition-colors duration-300 ${isActive ? 'text-white' : isPast ? 'text-slate-500' : 'text-slate-700'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${isActive ? 'border-teal-500/50 bg-teal-500/10' : isPast ? 'border-slate-700 bg-slate-800' : 'border-slate-800 bg-slate-900'}`}>
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> : icon}
            </div>
            <span className={`text-xs font-medium ${isActive ? 'font-bold text-teal-400' : ''}`}>{title}</span>
        </div>
    );
}
