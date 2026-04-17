"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, Suspense } from "react";
import { useAnalytics } from "@/modules/analytics/components/analytics-provider";
import { useSearchParams } from "next/navigation";

// ─── QUALIFICATION OPTIONS ──────────────────────────────────────────────────

const SERVICES = [
    { value: 'video', label: '🎬 Video & Contenido' },
    { value: 'branding', label: '🎨 Branding & Diseño' },
    { value: 'copywriting', label: '✍️ Copywriting & Copy' },
    { value: 'social', label: '📱 Redes Sociales' },
    { value: 'web', label: '💻 Desarrollo Web' },
    { value: 'ads', label: '📊 Pauta Digital (Ads)' },
    { value: 'estrategia', label: '🧠 Estrategia Digital' },
    { value: 'otro', label: '❓ Otro / No sé aún' },
];

const BUDGETS = [
    { value: 'lt_1m', label: 'Menos de $1M COP / mes' },
    { value: '1_3m', label: '$1M – $3M COP / mes' },
    { value: '3_6m', label: '$3M – $6M COP / mes' },
    { value: '6_15m', label: '$6M – $15M COP / mes' },
    { value: 'gt_15m', label: 'Más de $15M COP / mes' },
];

const COMPANY_SIZES = [
    { value: 'solo', label: 'Soy emprendedor / Marca personal' },
    { value: '2_10', label: '2–10 empleados' },
    { value: '11_50', label: '11–50 empleados' },
    { value: '51_plus', label: '51+ empleados' },
];

const TIMELINES = [
    { value: 'ahora', label: '🔥 Lo antes posible (esta semana)' },
    { value: '1_mes', label: '📅 En el próximo mes' },
    { value: '3_meses', label: '🗓️ En 1–3 meses' },
    { value: 'explorando', label: '🔭 Solo estoy explorando' },
];

// ─── SCHEMA ─────────────────────────────────────────────────────────────────

const formSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    email: z.string().email("Email inválido."),
    phone: z.string().min(7, "Ingresa un número de contacto válido."),
    company: z.string().optional(),
    company_size: z.string().min(1, "Selecciona el tamaño de tu empresa."),
    service: z.string().min(1, "Selecciona el servicio de interés."),
    budget: z.string().min(1, "Selecciona tu rango de inversión."),
    timeline: z.string().min(1, "Selecciona tu urgencia."),
    goal: z.string().min(10, "Cuéntanos brevemente tu objetivo principal."),
    how_found: z.string().optional(),
    consent: z.literal(true).refine((val) => val === true, {
        message: "Debes aceptar la política de privacidad.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

// ─── STEP INDICATOR ─────────────────────────────────────────────────────────

function StepDot({ active, done }: { active: boolean; done: boolean }) {
    return (
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${done ? 'bg-teal-500 scale-100' : active ? 'bg-teal-400 scale-125 ring-4 ring-teal-100' : 'bg-slate-200'}`} />
    );
}

// ─── SELECT FIELD ────────────────────────────────────────────────────────────

function SelectField({ label, id, options, error, register }: {
    label: string; id: string; options: { value: string; label: string }[];
    error?: string; register: ReturnType<typeof useForm<FormValues>>['register'];
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
            <select
                id={id}
                {...register(id as keyof FormValues)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
                <option value="">— Selecciona —</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── STEP CARD ────────────────────────────────────────────────────────────────

function StepCard({ step, total, title, children }: { step: number; total: number; title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{step}</div>
                <div>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Paso {step} de {total}</p>
                    <h3 className="text-sm font-black text-slate-900">{title}</h3>
                </div>
            </div>
            <div className="space-y-4 pl-10">{children}</div>
        </div>
    );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────

function ContactFormContent() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const { trackEvent } = useAnalytics();
    const searchParams = useSearchParams();

    const {
        register, handleSubmit, reset, setValue, watch, trigger,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

    useEffect(() => {
        const subject = searchParams.get('subject');
        if (subject) {
            const savings = searchParams.get('savings');
            const hours = searchParams.get('hours');
            if (savings && hours) {
                setValue("goal", `Vengo de la calculadora de ROI. Podría ahorrar $${savings} al año y recuperar ${hours} horas automatizando procesos.`);
            }
            const budget = searchParams.get('budget');
            const type = searchParams.get('type');
            if (budget) {
                setValue("goal", `Vengo del estimador. Proyecto tipo "${type}" con presupuesto de $${budget}.`);
            }
        }
    }, [searchParams, setValue]);

    // ── Step navigation ──
    const STEP_FIELDS: (keyof FormValues)[][] = [
        ['name', 'email', 'phone'],
        ['company', 'company_size'],
        ['service', 'budget', 'timeline'],
        ['goal', 'how_found'],
    ];
    const TOTAL_STEPS = STEP_FIELDS.length;

    const goNext = async () => {
        const valid = await trigger(STEP_FIELDS[currentStep - 1]);
        if (valid) setCurrentStep((p) => Math.min(p + 1, TOTAL_STEPS));
    };
    const goBack = () => setCurrentStep((p) => Math.max(p - 1, 1));

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true);
        try {
            const { submitContactForm } = await import("@/actions/contact");
            const result = await submitContactForm({
                email: data.email,
                name: data.name,
                company: data.company,
                phone: data.phone,
                formData: {
                    service: data.service,
                    budget: data.budget,
                    timeline: data.timeline,
                    company_size: data.company_size,
                    goal: data.goal,
                    how_found: data.how_found,
                },
                formId: "main_contact",
            });

            if (!result.success) {
                console.error("Failed to submit form:", result.error);
                // We still show success to user so they don"t get stuck
            }

            trackEvent("GENERATE_LEAD", {
                source: 'contact_form',
                email: data.email,
                company: data.company,
                service: data.service,
                budget: data.budget,
            });
            setIsSuccess(true);
            reset();
            setCurrentStep(1);
            setTimeout(() => setIsSuccess(false), 8000);
        } catch {
            setIsSuccess(true);
        } finally {
            setIsSubmitting(false);
        }
    }

    // ── Success state ──
    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-teal-200">✅</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¡Solicitud Recibida!</h3>
                <p className="text-slate-500 max-w-xs">Nuestro equipo revisará tu caso y se pondrá en contacto en <strong className="text-slate-700">menos de 24 horas</strong>.</p>
                <div className="mt-8 p-4 bg-teal-50 rounded-2xl border border-teal-100 text-left max-w-xs w-full">
                    <p className="text-xs font-black text-teal-700 uppercase tracking-wider mb-2">Mientras tanto puedes:</p>
                    <a href="https://wa.me/573223047353" className="text-sm text-teal-600 font-medium hover:underline block">💬 Escríbenos por WhatsApp ahora →</a>
                </div>
                <button onClick={() => setIsSuccess(false)} className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline">Enviar otra consulta</button>
            </div>
        );
    }

    // ── Progress bar ──
    const progress = (currentStep / TOTAL_STEPS) * 100;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Progress */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2 items-center">
                        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                            <StepDot key={i} active={i + 1 === currentStep} done={i + 1 < currentStep} />
                        ))}
                    </div>
                    <span className="text-xs font-mono text-slate-400">{currentStep}/{TOTAL_STEPS} · ~2 min</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-400 to-sky-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* ── STEP 1: Datos de contacto ── */}
            {currentStep === 1 && (
                <StepCard step={1} total={TOTAL_STEPS} title="¿Quién eres?">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nombre completo <span className="text-red-400">*</span></label>
                        <Input id="name" placeholder="Ana García" {...register("name")} className="bg-slate-50 border-slate-200 focus:ring-teal-400" />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email profesional <span className="text-red-400">*</span></label>
                            <Input id="email" type="email" placeholder="ana@empresa.com" {...register("email")} className="bg-slate-50 border-slate-200 focus:ring-teal-400" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-slate-700">WhatsApp / Teléfono <span className="text-red-400">*</span></label>
                            <Input id="phone" type="tel" placeholder="+57 300 000 0000" {...register("phone")} className="bg-slate-50 border-slate-200 focus:ring-teal-400" />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        </div>
                    </div>
                </StepCard>
            )}

            {/* ── STEP 2: Empresa ── */}
            {currentStep === 2 && (
                <StepCard step={2} total={TOTAL_STEPS} title="¿Cuéntanos sobre tu empresa">
                    <div className="space-y-2">
                        <label htmlFor="company" className="text-sm font-semibold text-slate-700">Nombre de la empresa <span className="text-slate-400 font-normal">(opcional)</span></label>
                        <Input id="company" placeholder="Mi Empresa S.A.S" {...register("company")} className="bg-slate-50 border-slate-200 focus:ring-teal-400" />
                    </div>
                    <SelectField
                        label="Tamaño de la empresa *"
                        id="company_size"
                        options={COMPANY_SIZES}
                        error={errors.company_size?.message}
                        register={register}
                    />
                </StepCard>
            )}

            {/* ── STEP 3: Proyecto ── */}
            {currentStep === 3 && (
                <StepCard step={3} total={TOTAL_STEPS} title="¿Qué necesitas?">
                    <SelectField
                        label="Servicio de interés *"
                        id="service"
                        options={SERVICES}
                        error={errors.service?.message}
                        register={register}
                    />
                    <SelectField
                        label="Presupuesto mensual aproximado *"
                        id="budget"
                        options={BUDGETS}
                        error={errors.budget?.message}
                        register={register}
                    />
                    <SelectField
                        label="¿Cuándo necesitas comenzar? *"
                        id="timeline"
                        options={TIMELINES}
                        error={errors.timeline?.message}
                        register={register}
                    />
                    {/* Budget hint */}
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                        <p className="text-xs text-teal-700">💡 <strong>¿No estás seguro del presupuesto?</strong> Selecciona el rango más bajo. Lo ajustamos juntos en la llamada.</p>
                    </div>
                </StepCard>
            )}

            {/* ── STEP 4: Objetivo ── */}
            {currentStep === 4 && (
                <StepCard step={4} total={TOTAL_STEPS} title="El detalle final">
                    <div className="space-y-2">
                        <label htmlFor="goal" className="text-sm font-semibold text-slate-700">
                            ¿Cuál es tu objetivo principal? <span className="text-red-400">*</span>
                        </label>
                        <p className="text-xs text-slate-400">¿Qué resultado quieres lograr? (ej: "conseguir 50 leads al mes", "aumentar ventas 30%", "lanzar nueva marca")</p>
                        <Textarea
                            id="goal"
                            placeholder="Mi objetivo es..."
                            className="min-h-[100px] bg-slate-50 border-slate-200 focus:ring-teal-400 text-sm"
                            {...register("goal")}
                        />
                        {errors.goal && <p className="text-xs text-red-500">{errors.goal.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="how_found" className="text-sm font-semibold text-slate-700">
                            ¿Cómo nos encontraste? <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <select
                            id="how_found"
                            {...register("how_found")}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all appearance-none"
                        >
                            <option value="">— Selecciona —</option>
                            {['Google', 'Instagram / Redes Sociales', 'Recomendación de un conocido', 'LinkedIn', 'YouTube', 'Otro'].map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400">Nos ayuda mucho saber de dónde vienen nuestros mejores clientes.</p>
                    </div>

                    {/* Consent */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <input
                            type="checkbox"
                            id="contact-consent"
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-400"
                            {...register("consent")}
                        />
                        <label htmlFor="contact-consent" className="text-xs text-slate-500 leading-relaxed">
                            He leído y acepto la <a href="/politica-privacidad" className="text-teal-600 underline hover:text-teal-700">Política de Privacidad</a> y el tratamiento de mis datos personales para recibir respuesta a esta consulta.
                        </label>
                    </div>
                    {errors.consent && <p className="text-xs text-red-500">{errors.consent.message}</p>}
                </StepCard>
            )}

            {/* ── NAVIGATION ── */}
            <div className="flex gap-3 pt-2">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={goBack}
                        className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                        ← Atrás
                    </button>
                )}
                {currentStep < TOTAL_STEPS ? (
                    <button
                        type="button"
                        onClick={goNext}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-sm hover:from-teal-600 hover:to-sky-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-teal-200"
                    >
                        Continuar →
                    </button>
                ) : (
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold hover:from-teal-600 hover:to-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-teal-200 h-auto py-3.5"
                    >
                        {isSubmitting ? '⏳ Enviando...' : '🚀 Enviar Consulta'}
                    </Button>
                )}
            </div>
        </form>
    );
}

export function ContactForm() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando formulario...</div>}>
            <ContactFormContent />
        </Suspense>
    );
}
