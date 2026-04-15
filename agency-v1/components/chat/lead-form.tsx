"use client";

import { useState } from "react";
import { initializeChat } from "@/actions/chat";
import { Loader2, User, Mail, ArrowRight, Shield, Clock, Star, Zap, ChevronDown, DollarSign, HelpCircle, Headphones, MessageSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeadFormProps {
    onChatStarted: (conversationId: string, visitorId: string) => void;
}

const TEAM_AVATARS = [
    { initials: "LM", color: "from-teal-500 to-emerald-500" },
    { initials: "AS", color: "from-pink-500 to-rose-500" },
    { initials: "JR", color: "from-amber-500 to-orange-500" },
];

const CONSULTATION_REASONS = [
    { id: "ventas", label: "Ventas", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
    { id: "soporte", label: "Soporte Técnico", icon: Headphones, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50" },
    { id: "dudas", label: "Dudas Generales", icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50" },
    { id: "otro", label: "Otro", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50" },
];

function FloatingInput({
    id,
    label,
    type = "text",
    value,
    onChange,
    icon: Icon,
    required,
    placeholder,
}: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    icon: React.ElementType;
    required?: boolean;
    placeholder?: string;
}) {
    const [focused, setFocused] = useState(false);
    const active = focused || value.length > 0;

    return (
        <div className="relative">
            <div
                className={cn(
                    "flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-all duration-200 bg-zinc-50 dark:bg-zinc-800/50",
                    active
                        ? "border-teal-400 dark:border-teal-600 ring-2 ring-teal-500/10"
                        : "border-zinc-200 dark:border-zinc-700"
                )}
            >
                <div className={cn("p-2 rounded-lg transition-colors shrink-0", active ? "bg-teal-100 dark:bg-teal-900/50" : "bg-zinc-100 dark:bg-zinc-700")}>
                    <Icon className={cn("h-4 w-4 transition-colors", active ? "text-teal-600 dark:text-teal-400" : "text-zinc-400")} />
                </div>
                <div className="flex-1 relative">
                    <label
                        htmlFor={id}
                        className={cn(
                            "absolute left-0 transition-all duration-200 pointer-events-none",
                            active ? "top-0 text-[10px] text-teal-600 font-semibold" : "top-1/2 -translate-y-1/2 text-sm text-zinc-400"
                        )}
                    >
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        id={id}
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        required={required}
                        className="w-full bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-100 pt-3 pb-0"
                        placeholder={active ? placeholder : ""}
                    />
                </div>
            </div>
        </div>
    );
}

function ReasonDropdown({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [focused, setFocused] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const selectedReason = CONSULTATION_REASONS.find(r => r.id === value);
    const active = focused || value.length > 0;

    return (
        <div className="relative">
            <div
                className={cn(
                    "flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-all duration-200 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer",
                    active || isOpen
                        ? "border-teal-400 dark:border-teal-600 ring-2 ring-teal-500/10"
                        : "border-zinc-200 dark:border-zinc-700"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={cn("p-2 rounded-lg transition-colors shrink-0", selectedReason?.bg || "bg-zinc-100 dark:bg-zinc-700")}>
                    {selectedReason ? (
                        <selectedReason.icon className={cn("h-4 w-4", selectedReason.color)} />
                    ) : (
                        <HelpCircle className={cn("h-4 w-4", active ? "text-teal-600" : "text-zinc-400")} />
                    )}
                </div>
                <div className="flex-1 relative">
                    <label
                        className={cn(
                            "absolute left-0 transition-all duration-200 pointer-events-none",
                            active || value ? "top-0 text-[10px] text-teal-600 font-semibold" : "top-1/2 -translate-y-1/2 text-sm text-zinc-400"
                        )}
                    >
                        Motivo de consulta
                    </label>
                    <div className={cn("text-sm pt-3 pb-0", value ? "text-zinc-800 dark:text-zinc-100" : "text-transparent")}>
                        {selectedReason?.label || "Selecciona una opción..."}
                    </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    >
                        {CONSULTATION_REASONS.map((reason) => (
                            <button
                                key={reason.id}
                                type="button"
                                onClick={() => { onChange(reason.id); setIsOpen(false); }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-left",
                                    value === reason.id && "bg-teal-50 dark:bg-teal-900/30"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-lg", reason.bg)}>
                                    <reason.icon className={cn("h-4 w-4", reason.color)} />
                                </div>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{reason.label}</span>
                                {value === reason.id && <Check className="h-4 w-4 text-teal-600 ml-auto" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function LeadForm({ onChatStarted }: LeadFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [message, setMessage] = useState("");
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = name.trim() && email.trim() && privacyAccepted;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        
        setIsSubmitting(true);
        setError("");

        let visitorId = localStorage.getItem("chat_visitor_id");
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem("chat_visitor_id", visitorId);
        }

        const fullMessage = reason 
            ? `[${CONSULTATION_REASONS.find(r => r.id === reason)?.label || reason}] ${message}`
            : message;

        try {
            const result = await initializeChat({ name, email, message: fullMessage, visitorId });
            if (result.success && result.conversationId) {
                onChatStarted(result.conversationId, visitorId);
            } else {
                setError("Error al iniciar el chat. Por favor intenta de nuevo.");
            }
        } catch {
            setError("Algo salió mal. Por favor intenta más tarde.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-5 space-y-5">
            {/* Social Proof */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3">
                <div className="flex -space-x-2">
                    {TEAM_AVATARS.map((a, i) => (
                        <div key={i} className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-zinc-900", a.color)}>
                            {a.initials}
                        </div>
                    ))}
                </div>
                <div>
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">+200 clientes satisfechos</p>
                </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-xl p-3 flex items-center gap-2.5 border border-teal-100 dark:border-teal-900/50">
                    <div className="p-1.5 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                        <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">&lt; 2 min</p>
                        <p className="text-[10px] text-zinc-500">Tiempo de respuesta</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-3 flex items-center gap-2.5 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">100% Seguro</p>
                        <p className="text-[10px] text-zinc-500">Datos protegidos</p>
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <FloatingInput id="name" label="Tu nombre" value={name} onChange={setName} icon={User} required placeholder="Ej: María García" />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <FloatingInput id="email" label="Tu email" type="email" value={email} onChange={setEmail} icon={Mail} required placeholder="tu@empresa.com" />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <ReasonDropdown value={reason} onChange={setReason} />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                    <FloatingInput 
                        id="message" 
                        label="Tu mensaje (opcional)" 
                        value={message} 
                        onChange={setMessage} 
                        icon={MessageSquare} 
                        placeholder="Cuéntanos más detalles..." 
                    />
                </motion.div>

                {/* Privacy Checkbox */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.4 }}
                    className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700"
                >
                    <button
                        type="button"
                        onClick={() => setPrivacyAccepted(!privacyAccepted)}
                        className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5",
                            privacyAccepted 
                                ? "bg-teal-500 border-teal-500" 
                                : "border-zinc-300 dark:border-zinc-600 hover:border-teal-400"
                        )}
                    >
                        {privacyAccepted && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <span className="font-medium">Acepto el tratamiento de mis datos</span> según la{" "}
                        <a href="/privacidad" className="text-teal-600 hover:underline">política de privacidad</a>.
                        <br />
                        <span className="text-zinc-400">Responderemos en menos de 2 minutos.</span>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <motion.button 
                    type="submit" 
                    disabled={!canSubmit || isSubmitting} 
                    whileHover={{ scale: canSubmit ? 1.01 : 1 }} 
                    whileTap={{ scale: canSubmit ? 0.99 : 1 }} 
                    className={cn(
                        "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300",
                        !canSubmit || isSubmitting 
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" 
                            : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                    )}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Iniciando chat...
                        </>
                    ) : (
                        <>
                            <Zap className="h-4 w-4" />
                            Iniciar Chat Ahora
                        </>
                    )}
                </motion.button>
            </form>
        </div>
    );
}