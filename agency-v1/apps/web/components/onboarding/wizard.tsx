'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, MessageSquare, Mail, Bot, ArrowRight, Zap } from "lucide-react";
import { completeOnboardingAndCloneTemplates } from "@/actions/onboarding";
import { toast } from "sonner";
import { EmailDomainCard } from "@/components/settings/email-domain-card";
// Re-utilizamos el diálogo de WhatsApp que ya existe en IntegrationConfigDialog
import { IntegrationConfigDialog } from "@/components/settings/integration-config-dialog";

interface OnboardingWizardProps {
    initialShow: boolean;
}

export function OnboardingWizard({ initialShow }: OnboardingWizardProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [cloning, setCloning] = useState(false);

    useEffect(() => {
        // Un pequeño retraso para que no sea brusco al cargar el dashboard
        if (initialShow) {
            const t = setTimeout(() => setOpen(true), 1500);
            return () => clearTimeout(t);
        }
    }, [initialShow]);

    const handleComplete = async () => {
        setCloning(true);
        try {
            const res = await completeOnboardingAndCloneTemplates();
            if (res.success) {
                toast.success("¡Onboarding completado! Tus agentes IA están listos.");
                setOpen(false);
            } else {
                toast.error(res.error || "Error al completar el onboarding");
            }
        } catch (e) {
            toast.error("Error inesperado");
        } finally {
            setCloning(false);
        }
    };

    if (!initialShow && !open) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-slate-950 border-slate-800 text-white shadow-2xl [&>button]:hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-900">
                    <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-500" 
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                    {/* Left Sidebar Steps */}
                    <div className="w-full md:w-1/3 bg-slate-900/50 p-6 border-r border-slate-800/60 hidden md:block">
                        <h2 className="text-xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                            Activación de Cuenta
                        </h2>
                        <div className="space-y-6">
                            <StepIndicator current={step} number={1} title="Canal: WhatsApp" icon={<MessageSquare className="w-4 h-4" />} />
                            <StepIndicator current={step} number={2} title="Canal: Email" icon={<Mail className="w-4 h-4" />} />
                            <StepIndicator current={step} number={3} title="Agentes IA" icon={<Bot className="w-4 h-4" />} />
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Conecta WhatsApp API</h3>
                                    <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                                        Para que tus automatizaciones puedan responder clientes, necesitamos conectar tu número de WhatsApp Business Cloud API.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                    <IntegrationConfigDialog provider="whatsapp" title="WhatsApp Business" />
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400">
                                        Saltar por ahora
                                    </Button>
                                    <Button onClick={() => setStep(2)} className="bg-teal-600 hover:bg-teal-500 text-white gap-2">
                                        Siguiente Paso <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                                    <Mail className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Email de Alta Entregabilidad</h3>
                                    <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                                        Registra tu dominio (ej. ventas@tuempresa.com) para enviar correos transaccionales y campañas sin caer en Spam.
                                    </p>
                                </div>
                                <div className="-mx-2 scale-95 origin-top-left">
                                    <EmailDomainCard />
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400">
                                        Atrás
                                    </Button>
                                    <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                                        Siguiente Paso <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 p-0.5 animate-pulse">
                                        <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                                            <Zap className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br from-teal-400 to-indigo-400" />
                                        </div>
                                    </div>
                                    {cloning && (
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                                            <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Cargando la Magia...</h3>
                                    <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-sm mx-auto">
                                        Estamos creando tus agentes de IA y flujos de automatización pre-configurados basados en las mejores prácticas B2B.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleComplete} 
                                    disabled={cloning}
                                    className="bg-white text-black hover:bg-slate-200 gap-2 w-full max-w-xs mt-4"
                                >
                                    {cloning ? "Inicializando Entorno..." : "Finalizar Onboarding"}
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
        <div className={`flex items-center gap-4 transition-colors duration-300 ${isActive ? 'text-white' : isPast ? 'text-slate-500' : 'text-slate-700'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isActive ? 'border-teal-500/50 bg-teal-500/10' : isPast ? 'border-slate-700 bg-slate-800' : 'border-slate-800 bg-slate-900'}`}>
                {isPast ? <CheckCircle2 className="w-4 h-4 text-teal-500" /> : icon}
            </div>
            <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{title}</span>
        </div>
    );
}
