'use client';

import { useCampaignWizard } from './wizard-store';
import { StepPlatform } from './step-platform';
import { StepTemplates } from './step-templates';
import { StepBudget } from './step-budget';
import { StepTargeting } from './step-targeting';
import { StepCreative } from './step-creative';
import { StepPreflight } from './step-preflight';
import { StepLaunch } from './step-launch';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
    { number: 0, label: 'Plantillas' },
    { number: 1, label: 'Plataforma' },
    { number: 2, label: 'Presupuesto' },
    { number: 3, label: 'Audiencia' },
    { number: 4, label: 'Creativos' },
    { number: 5, label: 'Validación' },
    { number: 6, label: 'Lanzar' },
];

import { useEffect } from 'react';
import { toast } from 'sonner';

export function CampaignWizard() {
    const { step } = useCampaignWizard();

    // FIX 4: Auto-save local draft
    useEffect(() => {
        if (step === 0) return;
        const interval = setInterval(() => {
            const state = useCampaignWizard.getState();
            if (state.name && state.platforms.length > 0) {
                localStorage.setItem('campaign_wizard_draft', JSON.stringify(state));
                toast.success('Borrador local guardado', { duration: 2000, position: 'bottom-right' });
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [step]);

    return (
        <div style={{ minHeight: "100vh", background: "transparent", padding: "24px" }}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Torre de Control — Nueva Campaña</h1>
                    <p className="text-gray-500 text-sm">
                        {step === 0 
                            ? 'Comienza desde una plantilla o configura tu campaña desde cero.'
                            : 'Configura y lanza anuncios en múltiples plataformas desde una sola interfaz.'}
                    </p>
                </div>

                {/* Start Button */}
                {step > 0 && (
                    <div className="mb-6">
                        <button 
                            onClick={() => useCampaignWizard.getState().setStep(0)}
                            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                            ← Volver a plantillas
                        </button>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="relative flex items-center justify-between mb-10">
                    <div className="absolute top-5 left-5 right-5 h-0.5 z-0" style={{ background: "rgba(30,41,59,0.8)" }} />
                    <div
                        className="absolute top-5 left-5 h-0.5 z-0 transition-all duration-500"
                        style={{ width: `${((step) / (STEPS.length - 1)) * 100}%`, background: "linear-gradient(to right, #0d9488, #2dd4bf)" }}
                    />

                    {STEPS.map(({ number, label }) => {
                        const done = number < step;
                        const current = number === step;

                        return (
                            <div key={number} className="relative z-10 flex flex-col items-center gap-2">
                                <div
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 700, fontSize: "13px", transition: "all 0.3s",
                                        border: done ? "2px solid #0d9488" : current ? "2px solid #2dd4bf" : "2px solid rgba(30,41,59,0.9)",
                                        background: done ? "#0d9488" : current ? "rgba(13,148,136,0.15)" : "rgba(11,15,25,0.8)",
                                        color: done ? "#fff" : current ? "#2dd4bf" : "#334155",
                                        boxShadow: current ? "0 0 16px rgba(45,212,191,0.3)" : done ? "0 0 10px rgba(13,148,136,0.3)" : undefined,
                                    }}
                                >
                                    {done ? <Check style={{ width: "12px", height: "12px" }} /> : number}
                                </div>
                                <span style={{
                                    fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap", fontFamily: "monospace",
                                    color: current ? "#2dd4bf" : done ? "#475569" : "#1e293b",
                                }}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                    {/* Step Content */}
                    <div className="relative overflow-hidden" style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}>
                        <div style={{ marginBottom: "22px" }}>
                            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
                                {step === 0 ? 'Inicio' : `Paso ${step}: ${STEPS[step]?.label}`}
                            </h2>
                            <div style={{ height: "2px", width: "40px", background: "linear-gradient(to right, #0d9488, #2dd4bf)", marginTop: "8px", borderRadius: "99px" }} />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                {step === 0 && <StepTemplates />}
                                {step === 1 && <StepPlatform />}
                                {step === 2 && <StepBudget />}
                                {step === 3 && <StepTargeting />}
                                {step === 4 && <StepCreative />}
                                {step === 5 && <StepPreflight />}
                                {step === 6 && <StepLaunch />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
    );
}
