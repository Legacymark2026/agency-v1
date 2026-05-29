"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Activity, Shield, Search, Globe, MapPin, CheckCircle2, 
    XCircle, AlertCircle, ArrowRight, Lock, Sparkles, Smartphone,
    ChevronRight, ExternalLink, RefreshCw, Send, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auditDomainAction, AuditReport } from "@/actions/audit";
import { submitContactForm } from "@/actions/contact";

// Lead form schema
const leadSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    email: z.string().email("Email profesional inválido."),
    phone: z.string().min(7, "Ingresa un número de contacto válido."),
    company: z.string().optional(),
    consent: z.literal(true, {
        errorMap: () => ({ message: "Debes aceptar la política de privacidad." })
    })
});

type LeadFormValues = z.infer<typeof leadSchema>;

const loadingSteps = [
    "Conectando al servidor y resolviendo DNS...",
    "Verificando validez del certificado SSL y HTTPS...",
    "Analizando estructura de etiquetas meta y SEO técnico...",
    "Evaluando viewport móvil y adaptabilidad de interfaz...",
    "Comprobando integridad de enlaces y buscando roturas...",
    "Verificando posicionamiento en Google Maps y directorios locales...",
    "Calculando puntaje de rendimiento y latencia (TTFB)...",
    "Generando informe de optimización mediante Inteligencia Artificial..."
];

export function AuditClient() {
    const [domain, setDomain] = useState("");
    const [auditState, setAuditState] = useState<"idle" | "loading" | "lead_capture" | "results">("idle");
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);
    
    // Store generated report temporarily while capturing lead
    const [tempReport, setTempReport] = useState<AuditReport | null>(null);
    const [report, setReport] = useState<AuditReport | null>(null);
    const [activeTab, setActiveTab] = useState<"seo" | "speed" | "usability" | "security" | "local">("seo");
    
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema)
    });

    // Step cycler for the loading screen
    useEffect(() => {
        if (auditState !== "loading") return;

        const interval = setInterval(() => {
            setCurrentStepIdx((prev) => {
                if (prev < loadingSteps.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [auditState]);

    const handleStartAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        let cleanDomain = domain.trim().toLowerCase();
        cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
        cleanDomain = cleanDomain.split("/")[0];

        if (!cleanDomain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanDomain)) {
            setError("Por favor ingresa un dominio válido (ej: miweb.com).");
            return;
        }

        setAuditState("loading");
        setCurrentStepIdx(0);

        try {
            // Trigger server action in parallel
            const result = await auditDomainAction(cleanDomain);
            
            // Artificial delay to allow loading animations to feel comprehensive and premium
            await new Promise((resolve) => setTimeout(resolve, 6000));

            if (result.success && result.report) {
                setTempReport(result.report);
                setAuditState("lead_capture");
            } else {
                setError(result.error || "Ocurrió un error al analizar el dominio. Por favor intenta de nuevo.");
                setAuditState("idle");
            }
        } catch (err) {
            console.error(err);
            setError("No pudimos conectar con el sitio web especificado. Verifica que el dominio esté activo.");
            setAuditState("idle");
        }
    };

    const handleLeadSubmit = async (data: LeadFormValues) => {
        if (!tempReport) return;
        setIsSubmittingLead(true);

        try {
            // Store lead in DB using existing action
            await submitContactForm({
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company || "",
                message: `Auditoría web solicitada para el dominio: ${tempReport.domain}. Puntuación inicial: ${tempReport.score}/100.`,
                formId: "web_audit",
                formData: {
                    domain: tempReport.domain,
                    score: tempReport.score,
                    improvements: tempReport.improvements,
                    speedScore: tempReport.details.speed.score,
                    seoScore: tempReport.details.seo.score,
                    usabilityScore: tempReport.details.usability.score,
                    securityScore: tempReport.details.security.score,
                    localSeoScore: tempReport.details.localSeo.score
                }
            });

            // Unlock results
            setReport(tempReport);
            setAuditState("results");
        } catch (err) {
            console.error(err);
            // Even if lead capture saving fails internally, let the user see the report they worked for
            setReport(tempReport);
            setAuditState("results");
        } finally {
            setIsSubmittingLead(false);
        }
    };

    // Helper for coloring scores
    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-emerald-400 border-emerald-500/30";
        if (score >= 60) return "text-amber-400 border-amber-500/30";
        return "text-rose-400 border-rose-500/30";
    };

    const getScoreBg = (score: number) => {
        if (score >= 85) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (score >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 85) return "Optimizado";
        if (score >= 60) return "Necesita Mejoras";
        return "Crítico";
    };

    return (
        <div className="relative w-full max-w-6xl mx-auto px-4 py-8 md:py-16">
            
            {/* Viewfinder corners */}
            {["top-4 left-4 border-t-2 border-l-2", "top-4 right-4 border-t-2 border-r-2", "bottom-4 left-4 border-b-2 border-l-2", "bottom-4 right-4 border-b-2 border-r-2"].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-teal-500/10 hidden md:block ${cls}`} aria-hidden />
            ))}

            <AnimatePresence mode="wait">
                
                {/* 1. IDLE STATE: Enter Domain */}
                {auditState === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-12 md:py-20 max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md shadow-md mb-8">
                            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                            <span className="text-teal-400 text-xs font-black tracking-widest uppercase">AUDITORÍA DIGITAL GRATUITA</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-6">
                            Descubre qué tan rápido y <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-sky-400 to-violet-500">
                                Optimizado está tu sitio web
                            </span>
                        </h1>

                        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                            Analiza en tiempo real la velocidad de carga, estructura SEO, seguridad SSL, enlaces rotos y tu presencia local en Google Maps en segundos.
                        </p>

                        <form onSubmit={handleStartAudit} className="relative max-w-2xl mx-auto">
                            <div className="flex flex-col sm:flex-row items-stretch gap-3 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-full backdrop-blur-md shadow-2xl">
                                <div className="flex-1 flex items-center gap-3 px-4 py-3">
                                    <Globe className="w-5 h-5 text-slate-500 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="tudominio.com"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-base border-none p-0 focus:ring-0"
                                        disabled={auditState !== "idle"}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="rounded-xl sm:rounded-full px-8 py-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold font-mono tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-teal-500/20 text-sm uppercase shrink-0"
                                >
                                    Analizar sitio <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 mt-4 text-rose-400 text-sm justify-center bg-rose-500/10 border border-rose-500/20 py-2.5 px-4 rounded-xl max-w-md mx-auto"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </form>

                        {/* Visual Trust Indicators */}
                        <div className="mt-16 pt-10 border-t border-slate-950 flex flex-wrap justify-center gap-8 text-xs font-mono text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Reporte Instantáneo
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Diagnóstico de Google Maps
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Basado en IA Gemini
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. LOADING STATE: Processing Web Audit */}
                {auditState === "loading" && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="py-16 md:py-24 text-center max-w-xl mx-auto"
                    >
                        <div className="relative w-28 h-28 mx-auto mb-10">
                            {/* Spinning outer rings */}
                            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-teal-400 animate-spin" style={{ animationDuration: "1.5s" }} />
                            <div className="absolute inset-2 rounded-full border-4 border-slate-800 border-b-violet-400 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
                            
                            {/* Inner pulses */}
                            <div className="absolute inset-4 rounded-full bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner">
                                <Search className="w-8 h-8 text-teal-400 animate-pulse" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                            Ejecutando Diagnóstico Digital
                        </h2>
                        
                        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl mb-6">
                            <p className="text-sm font-mono text-teal-400 truncate">
                                AUDITANDO: {domain.replace(/^(https?:\/\/)?(www\.)?/, "")}
                            </p>
                        </div>

                        <div className="min-h-[48px] flex items-center justify-center">
                            <motion.p
                                key={currentStepIdx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-slate-400 text-sm md:text-base font-medium"
                            >
                                {loadingSteps[currentStepIdx]}
                            </motion.p>
                        </div>

                        <div className="w-full bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden mt-8">
                            <div 
                                className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-violet-500 transition-all duration-1000 ease-out" 
                                style={{ width: `${((currentStepIdx + 1) / loadingSteps.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs font-mono text-slate-600 mt-2">
                            Paso {currentStepIdx + 1} de {loadingSteps.length} · Aproximadamente 6 segundos
                        </p>
                    </motion.div>
                )}

                {/* 3. LEAD CAPTURE STATE: Form submission before unlock */}
                {auditState === "lead_capture" && (
                    <motion.div
                        key="lead_capture"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
                            {/* Top gradient highlight */}
                            <div className="h-1.5 bg-gradient-to-r from-teal-400 via-sky-400 to-violet-500" />
                            
                            <div className="px-6 py-8 md:p-10">
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Lock className="w-6 h-6 text-teal-400 animate-pulse" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                        ¡Análisis Completado!
                                    </h2>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                                        Para desbloquear tu informe de rendimiento detallado en tiempo real de <strong className="text-white">{domain}</strong>, por favor completa tus datos.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(handleLeadSubmit)} className="space-y-4">
                                    <div className="space-y-1">
                                        <label htmlFor="name" className="text-xs font-mono text-slate-400 uppercase tracking-widest block">Nombre Completo *</label>
                                        <Input
                                            id="name"
                                            placeholder="Ana María Gómez"
                                            {...register("name")}
                                            className="bg-slate-950/80 border-slate-800 text-white focus:border-teal-500"
                                        />
                                        {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label htmlFor="email" className="text-xs font-mono text-slate-400 uppercase tracking-widest block">Email Profesional *</label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="ana@empresa.com"
                                                {...register("email")}
                                                className="bg-slate-950/80 border-slate-800 text-white focus:border-teal-500"
                                            />
                                            {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="phone" className="text-xs font-mono text-slate-400 uppercase tracking-widest block">Teléfono / WhatsApp *</label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+57 300 000 0000"
                                                {...register("phone")}
                                                className="bg-slate-950/80 border-slate-800 text-white focus:border-teal-500"
                                            />
                                            {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label htmlFor="company" className="text-xs font-mono text-slate-400 uppercase tracking-widest block">Empresa <span className="text-slate-600">(opcional)</span></label>
                                        <Input
                                            id="company"
                                            placeholder="Mi Empresa S.A.S."
                                            {...register("company")}
                                            className="bg-slate-950/80 border-slate-800 text-white focus:border-teal-500"
                                        />
                                    </div>

                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 mt-4">
                                        <input
                                            type="checkbox"
                                            id="consent"
                                            className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500"
                                            {...register("consent")}
                                        />
                                        <label htmlFor="consent" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                                            Acepto la <a href="/politica-privacidad" className="text-teal-400 underline hover:text-teal-300">Política de Privacidad</a> y autorizo a LegacyMark a contactarme para presentar recomendaciones de mejora.
                                        </label>
                                    </div>
                                    {errors.consent && <p className="text-xs text-rose-400 mt-1">{errors.consent.message}</p>}

                                    <Button
                                        type="submit"
                                        disabled={isSubmittingLead}
                                        className="w-full rounded-2xl py-6 mt-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold font-mono tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-teal-500/10 text-sm uppercase"
                                    >
                                        {isSubmittingLead ? "Generando Acceso..." : "Ver Mi Informe de Auditoría"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 4. RESULTS STATE: Dashboard display */}
                {auditState === "results" && report && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        
                        {/* Header Details */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                            <div>
                                <span className="text-xs font-mono text-teal-400 uppercase tracking-widest">INFORME DE DOMINIO :: TELEMETRÍA ACTIVA</span>
                                <h2 className="text-3xl font-black text-white mt-1 truncate max-w-md">
                                    {report.domain}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Auditado el {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })} · Conexión: {report.url}
                                </p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setReport(null);
                                    setAuditState("idle");
                                    setDomain("");
                                }}
                                className="rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs px-4"
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                Auditar otro dominio
                            </Button>
                        </div>

                        {/* Core Stats Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* Score Display Card */}
                            <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-800 bg-slate-900/80 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
                                <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-6">PUNTUACIÓN GLOBAL</h3>
                                
                                <div className="relative w-44 h-44 flex items-center justify-center">
                                    {/* SVG Radial Gauge */}
                                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        {/* Back circle */}
                                        <circle cx="50" cy="50" r="42" strokeWidth="8" stroke="#1e293b" fill="transparent" />
                                        {/* Front animated circle */}
                                        <motion.circle 
                                            cx="50" 
                                            cy="50" 
                                            r="42" 
                                            strokeWidth="8" 
                                            stroke={report.score >= 85 ? "#2dd4bf" : report.score >= 60 ? "#fbbf24" : "#f87171"} 
                                            fill="transparent" 
                                            strokeDasharray="264"
                                            initial={{ strokeDashoffset: 264 }}
                                            animate={{ strokeDashoffset: 264 - (264 * report.score) / 100 }}
                                            transition={{ duration: 1.8, ease: "easeOut" }}
                                        />
                                    </svg>
                                    <div className="text-center">
                                        <span className="text-5xl font-black text-white">{report.score}</span>
                                        <span className="text-slate-500 text-lg">/100</span>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-2 mt-8 px-4 py-1.5 rounded-full border ${getScoreBg(report.score)}`}>
                                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-wider">{getScoreLabel(report.score)}</span>
                                </div>
                            </div>

                            {/* Section Sub-Scores Card */}
                            <div className="lg:col-span-8 p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
                                <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-6">TELEMETRÍA DE COMPONENTES</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* SEO Score Row */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                                                <Search className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Estructura SEO</h4>
                                                <p className="text-xs text-slate-500">Meta tags y jerarquía HTML</p>
                                            </div>
                                        </div>
                                        <span className={`text-xl font-mono font-black ${getScoreColor(report.details.seo.score)}`}>
                                            {report.details.seo.score}%
                                        </span>
                                    </div>

                                    {/* Speed Row */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Velocidad</h4>
                                                <p className="text-xs text-slate-500">Tiempo de respuesta servidor (TTFB)</p>
                                            </div>
                                        </div>
                                        <span className={`text-xl font-mono font-black ${getScoreColor(report.details.speed.score)}`}>
                                            {report.details.speed.score}%
                                        </span>
                                    </div>

                                    {/* Usability Row */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Usabilidad</h4>
                                                <p className="text-xs text-slate-500">Viewport y responsividad móvil</p>
                                            </div>
                                        </div>
                                        <span className={`text-xl font-mono font-black ${getScoreColor(report.details.usability.score)}`}>
                                            {report.details.usability.score}%
                                        </span>
                                    </div>

                                    {/* Security Row */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Seguridad</h4>
                                                <p className="text-xs text-slate-500">SSL y enlaces rotos</p>
                                            </div>
                                        </div>
                                        <span className={`text-xl font-mono font-black ${getScoreColor(report.details.security.score)}`}>
                                            {report.details.security.score}%
                                        </span>
                                    </div>
                                </div>

                                {/* Local SEO banner */}
                                <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-900 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">SEO Local & Mapas</h4>
                                            <p className="text-xs text-slate-500">Presencia en Google Maps y marcado Schema</p>
                                        </div>
                                    </div>
                                    <span className={`text-xl font-mono font-black ${getScoreColor(report.details.localSeo.score)}`}>
                                        {report.details.localSeo.score}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tabs Detailed Analysis */}
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                            {/* Tab selectors */}
                            <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/40 p-2 gap-1 scrollbar-none">
                                {[
                                    { id: "seo", label: "SEO On-Page", icon: Search },
                                    { id: "speed", label: "Rendimiento", icon: Activity },
                                    { id: "usability", label: "Usabilidad", icon: Smartphone },
                                    { id: "security", label: "Seguridad", icon: Shield },
                                    { id: "local", label: "SEO Local", icon: MapPin }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const active = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-mono uppercase tracking-wider font-bold transition-all whitespace-nowrap ${
                                                active 
                                                    ? "bg-slate-900 text-teal-400 border border-slate-800/80 shadow-md" 
                                                    : "text-slate-500 hover:text-slate-300"
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${active ? "text-teal-400 animate-pulse" : "text-slate-500"}`} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab content panel */}
                            <div className="p-6 md:p-8">
                                <AnimatePresence mode="wait">
                                    
                                    {/* SEO PANEL */}
                                    {activeTab === "seo" && (
                                        <motion.div
                                            key="seo"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-800/60 pb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                        Análisis de SEO Técnico
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mt-1">
                                                        Evaluación de metadatos básicos y optimización semántica.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500 uppercase">Subscore:</span>
                                                    <span className={`text-3xl font-mono font-black ${getScoreColor(report.details.seo.score)}`}>
                                                        {report.details.seo.score}/100
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    {/* Title */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.seo.titleVerdict.includes("Óptimo") ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Etiqueta &lt;title&gt;</h4>
                                                            <p className="text-sm font-bold text-white mt-1 truncate">
                                                                {report.details.seo.title}
                                                            </p>
                                                            <p className="text-xs font-mono text-teal-400 mt-1">
                                                                {report.details.seo.titleLength} caracteres · {report.details.seo.titleVerdict}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.seo.descriptionVerdict.includes("Óptimo") ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Etiqueta Meta Description</h4>
                                                            <p className="text-sm font-bold text-white mt-1 line-clamp-2">
                                                                {report.details.seo.description}
                                                            </p>
                                                            <p className="text-xs font-mono text-teal-400 mt-1">
                                                                {report.details.seo.descriptionLength} caracteres · {report.details.seo.descriptionVerdict}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* H1 structure */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.seo.h1Verdict.includes("Óptimo") ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="w-5 h-5 text-rose-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Estructura de Encabezados (H1)</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.seo.h1Count} etiquetas H1 detectadas
                                                            </p>
                                                            <p className="text-xs font-mono text-teal-400 mt-1">
                                                                Estado: {report.details.seo.h1Verdict}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Feedback paragraph */}
                                                <div className="p-6 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-teal-400" />
                                                            Análisis de Inteligencia
                                                        </h4>
                                                        <p className="text-slate-300 text-sm leading-relaxed">
                                                            {report.details.seo.feedback}
                                                        </p>
                                                    </div>
                                                    
                                                    {report.details.seo.imagesMissingAlt > 0 && (
                                                        <div className="mt-6 flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2.5 px-4 rounded-xl text-xs">
                                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                                            <span>Se encontraron {report.details.seo.imagesMissingAlt} imágenes de {report.details.seo.imagesCount} totales sin atributo Alt.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* SPEED PANEL */}
                                    {activeTab === "speed" && (
                                        <motion.div
                                            key="speed"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-800/60 pb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                        Rendimiento y Latencia
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mt-1">
                                                        Velocidad de carga inicial medida directamente desde nuestros servidores.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500 uppercase">Subscore:</span>
                                                    <span className={`text-3xl font-mono font-black ${getScoreColor(report.details.speed.score)}`}>
                                                        {report.details.speed.score}/100
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900 text-center">
                                                        <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Tiempo de respuesta inicial (TTFB)</h4>
                                                        <div className="text-5xl font-mono font-black text-white mb-2">
                                                            {report.details.speed.ttfb} <span className="text-base text-slate-500 font-bold">ms</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            Time To First Byte: Tiempo transcurrido para recibir el primer byte de respuesta.
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className={`p-3 rounded-xl border text-center ${report.details.speed.ttfb < 200 ? "bg-teal-500/10 border-teal-500/20 text-teal-400" : "bg-slate-950/20 border-slate-900 text-slate-600"}`}>
                                                            <div className="text-xs font-mono font-black">&lt;200ms</div>
                                                            <div className="text-[10px] uppercase font-mono mt-1">Excelente</div>
                                                        </div>
                                                        <div className={`p-3 rounded-xl border text-center ${report.details.speed.ttfb >= 200 && report.details.speed.ttfb <= 600 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-950/20 border-slate-900 text-slate-600"}`}>
                                                            <div className="text-xs font-mono font-black">200-600ms</div>
                                                            <div className="text-[10px] uppercase font-mono mt-1">Aceptable</div>
                                                        </div>
                                                        <div className={`p-3 rounded-xl border text-center ${report.details.speed.ttfb > 600 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-slate-950/20 border-slate-900 text-slate-600"}`}>
                                                            <div className="text-xs font-mono font-black">&gt;600ms</div>
                                                            <div className="text-[10px] uppercase font-mono mt-1">Lento</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-teal-400" />
                                                            Diagnóstico de Carga
                                                        </h4>
                                                        <p className="text-slate-300 text-sm leading-relaxed">
                                                            {report.details.speed.feedback}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-400">
                                                        💡 <strong>Consejo rápido:</strong> Sitios veloces disminuyen drásticamente el rebote del usuario y son indexados en posiciones más altas por Google.
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* USABILITY PANEL */}
                                    {activeTab === "usability" && (
                                        <motion.div
                                            key="usability"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-800/60 pb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                        Usabilidad Móvil y Experiencia
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mt-1">
                                                        Análisis de compatibilidad del viewport del dominio auditado.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500 uppercase">Subscore:</span>
                                                    <span className={`text-3xl font-mono font-black ${getScoreColor(report.details.usability.score)}`}>
                                                        {report.details.usability.score}/100
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    {/* Viewport Meta tag */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.usability.hasViewport ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="w-5 h-5 text-rose-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Etiqueta Viewport Móvil</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.usability.hasViewport ? "Presente y Configurada" : "No detectada"}
                                                            </p>
                                                            <p className="text-xs font-mono text-slate-500 mt-1">
                                                                Estado: {report.details.usability.responsiveVerdict}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Mobile Friendly banner */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.usability.mobileFriendly ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="w-5 h-5 text-rose-400 animate-bounce" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Indexación Mobile-First</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.usability.mobileFriendly ? "Apto para dispositivos móviles" : "Impacto orgánico crítico"}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                                Google penaliza los sitios que no se adaptan a celulares obligando a hacer zoom horizontal.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-teal-400" />
                                                            Diagnóstico de Usabilidad
                                                        </h4>
                                                        <p className="text-slate-300 text-sm leading-relaxed">
                                                            {report.details.usability.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* SECURITY PANEL */}
                                    {activeTab === "security" && (
                                        <motion.div
                                            key="security"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-800/60 pb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                        Seguridad y Enlaces Rotos
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mt-1">
                                                        Certificados de conexión segura SSL y estado de vínculos salientes.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500 uppercase">Subscore:</span>
                                                    <span className={`text-3xl font-mono font-black ${getScoreColor(report.details.security.score)}`}>
                                                        {report.details.security.score}/100
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    {/* SSL Cert */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.security.sslValid ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="w-5 h-5 text-rose-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Certificado SSL (Conexión Segura)</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.security.sslValid ? `Certificado Activo (${report.details.security.protocol})` : "Inseguro / Sin SSL Activo"}
                                                            </p>
                                                            <p className="text-xs font-mono text-slate-500 mt-1 leading-relaxed">
                                                                Emisor: {report.details.security.sslIssuer} <br />
                                                                Expira el: {report.details.security.sslExpiry}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Broken Links Check */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.security.brokenLinksCount === 0 ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="w-5 h-5 text-rose-400 animate-pulse" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Estado de Enlaces</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.security.brokenLinksCount === 0 ? "Sin enlaces rotos detectados" : `${report.details.security.brokenLinksCount} enlaces rotos encontrados`}
                                                            </p>
                                                            {report.details.security.brokenLinksCount > 0 && (
                                                                <div className="mt-2 space-y-1 text-[11px] font-mono text-rose-400 overflow-x-auto">
                                                                    {report.details.security.brokenLinks.map((l, i) => (
                                                                        <div key={i} className="truncate">🔗 {l}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-teal-400" />
                                                            Diagnóstico de Seguridad
                                                        </h4>
                                                        <p className="text-slate-300 text-sm leading-relaxed">
                                                            {report.details.security.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* LOCAL SEO PANEL */}
                                    {activeTab === "local" && (
                                        <motion.div
                                            key="local"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-800/60 pb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                        Presencia en Mapas y SEO Local
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mt-1">
                                                        Análisis de visibilidad geográfica del negocio físico.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500 uppercase">Subscore:</span>
                                                    <span className={`text-3xl font-mono font-black ${getScoreColor(report.details.localSeo.score)}`}>
                                                        {report.details.localSeo.score}/100
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    {/* Google Maps link check */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.localSeo.hasGoogleMaps ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Presencia en Google Maps</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.localSeo.hasGoogleMaps ? "Enlace o mapa integrado" : "Sin vinculación directa"}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                                Estado: {report.details.localSeo.googleMapsVerdict}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Schema LocalBusiness */}
                                                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-start gap-4">
                                                        <div className="mt-1">
                                                            {report.details.localSeo.hasLocalSchema ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="w-5 h-5 text-slate-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Marcado estructurado (Schema)</h4>
                                                            <p className="text-sm font-bold text-white mt-1">
                                                                {report.details.localSeo.hasLocalSchema ? "Schema LocalBusiness detectado" : "Falta estructurar Schema de dirección"}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                                Dirección física detectada en web: <strong className="text-slate-400 font-semibold">{report.details.localSeo.localAddress || "Ninguna"}</strong>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-teal-400" />
                                                            Diagnóstico SEO Local
                                                        </h4>
                                                        <p className="text-slate-300 text-sm leading-relaxed">
                                                            {report.details.localSeo.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Custom Priorities / Actions Suggested */}
                        <div className="p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="mb-8">
                                <span className="text-xs font-mono text-teal-400 uppercase tracking-widest">PLAN DE ACCIÓN PRIORITARIO</span>
                                <h3 className="text-2xl font-black text-white mt-1">
                                    3 Recomendaciones de Alto Impacto
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Aplica estas mejoras en tu sitio web para corregir brechas técnicas e impulsar tu conversión.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {report.improvements.map((imp, idx) => (
                                    <div 
                                        key={idx} 
                                        className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-teal-500/20 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold ${
                                                    imp.impact === "high" 
                                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                                                        : imp.impact === "medium"
                                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                        : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                                }`}>
                                                    Impacto {imp.impact === "high" ? "Alto" : imp.impact === "medium" ? "Medio" : "Bajo"}
                                                </span>
                                                <span className="text-xs font-mono text-slate-600">0{idx + 1}</span>
                                            </div>
                                            <h4 className="text-base font-bold text-white leading-snug">
                                                {imp.title}
                                            </h4>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                {imp.description}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-6 pt-4 border-t border-slate-900 flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                            Categoría: <strong className="text-slate-400">{imp.category}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Pitch Banner */}
                        <div className="py-12 px-6 sm:px-12 rounded-3xl relative overflow-hidden text-center" style={{ background: "linear-gradient(135deg, #020617 0%, #042f2e 60%, #0c2340 100%)" }}>
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(13,148,136,0.12),transparent)] pointer-events-none" />
                            <div 
                                className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
                            />
                            
                            <div className="relative z-10 max-w-xl mx-auto space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 mx-auto">
                                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                                    <span className="text-teal-400 text-xs font-black uppercase tracking-widest">ASESORÍA ESTRATÉGICA</span>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                                    ¿Quieres que optimicemos tu sitio por ti?
                                </h3>
                                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                                    Nuestros desarrolladores de élite e ingenieros de SEO en LegacyMark pueden corregir todos los problemas detectados y disparar la conversión de tu página.
                                </p>
                                <a 
                                    href={`/contacto?subject=Auditoria_${report.domain}&score=${report.score}`}
                                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold font-mono tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-500/20 text-sm uppercase mt-4"
                                >
                                    Agendar Consultoría Gratuita <ChevronRight className="w-4 h-4" />
                                </a>
                                <p className="text-xs text-slate-500">
                                    Llamada de 15 minutos sin compromiso · Cupos limitados para este mes
                                </p>
                            </div>
                        </div>

                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
