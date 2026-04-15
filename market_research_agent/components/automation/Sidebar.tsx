"use client";

import React from 'react';
import {
    Mail, MessageSquare, Clock, Split, Zap, Bot, Webhook, Smartphone, Phone,
    Briefcase, Users, CheckCircle, LayoutDashboard, ArrowRight, CalendarClock,
    ActivitySquare, Tags, UserPlus, Network, GitBranch, Repeat, Mic, BookOpen,
    FileJson, Terminal, Search, CalendarPlus, CreditCard, ShoppingCart, Target,
    Inbox, FileText, Bell, Sparkles, Database, Layers, Globe, Star, ShieldCheck,
    PhoneCall, Wand2, ArrowLeftRight
} from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string, data?: any) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', label);
        if (data) {
            event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-72 border-r border-slate-700/60 bg-slate-900 flex flex-col h-full z-10 shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-700/60" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)'}}>
                <h2 className="font-bold text-teal-300 text-sm uppercase tracking-widest flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-teal-400" />
                    Catálogo de Nodos
                </h2>
                <p className="text-xs text-slate-400 mt-1">Arrastra los bloques hacia el canvas.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">

                {/* Triggers Section */}
                <Section title="Disparadores" description="Inicia tu flujo de trabajo">
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Form Submission', { triggerType: 'FORM_SUBMISSION' })}
                        icon={<Zap size={16} className="text-amber-400" />}
                        label="Formulario Enviado"
                        color="bg-amber-950/40 border-amber-700/80 text-amber-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'WhatsApp Keyword', { triggerType: 'WHATSAPP_TRIGGER' })}
                        icon={<MessageSquare size={16} className="text-green-400" />}
                        label="Mensaje Entrante WA"
                        color="bg-green-950/40 border-green-700/80 text-green-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Meta Lead Ads', { triggerType: 'META_LEADS' })}
                        icon={<Target size={16} className="text-blue-400" />}
                        label="Lead Capturado (Meta)"
                        color="bg-blue-950/40 border-blue-700/80 text-blue-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Stripe Payment', { triggerType: 'STRIPE_PAYMENT' })}
                        icon={<CreditCard size={16} className="text-indigo-400" />}
                        label="Pago Recibido (Stripe)"
                        color="bg-indigo-950/40 border-indigo-700/80 text-indigo-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Shopify Order', { triggerType: 'SHOPIFY_ORDER' })}
                        icon={<ShoppingCart size={16} className="text-emerald-400" />}
                        label="Nueva Orden Shopify"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Email Inbound', { triggerType: 'EMAIL_LISTENER' })}
                        icon={<Inbox size={16} className="text-slate-400" />}
                        label="Email Recibido"
                        color="bg-slate-800/80 border-slate-600 text-white"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Deal Stage Changed', { triggerType: 'DEAL_STAGE_CHANGED' })}
                        icon={<Briefcase size={16} className="text-purple-400" />}
                        label="Cambio de Etapa (Deal)"
                        color="bg-purple-950/40 border-purple-700/80 text-purple-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Scheduled Time', { triggerType: 'SCHEDULE' })}
                        icon={<CalendarClock size={16} className="text-rose-400" />}
                        label="Horario / Cron"
                        color="bg-rose-950/40 border-rose-700/80 text-rose-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'triggerNode', 'Webhook Listener', { triggerType: 'WEBHOOK_LISTENER' })}
                        icon={<Webhook size={16} className="text-teal-400" />}
                        label="Escuchar Webhook"
                        color="bg-teal-950/40 border-teal-700/80 text-teal-50"
                    />
                </Section>

                {/* CRM Actions Section */}
                <Section title="Acciones CRM & Ventas" description="Actualiza base de datos">
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Create Task', { actionType: 'CREATE_TASK' })}
                        icon={<CheckCircle size={16} className="text-emerald-400" />}
                        label="Crear Tarea"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Update Deal', { actionType: 'UPDATE_DEAL' })}
                        icon={<Briefcase size={16} className="text-emerald-400" />}
                        label="Actualizar Deal"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Adjust Score', { actionType: 'ADJUST_SCORE' })}
                        icon={<Star size={16} className="text-fuchsia-400" />}
                        label="Ajustar Lead Score"
                        color="bg-fuchsia-950/40 border-fuchsia-700/80 text-fuchsia-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Meta Audience', { actionType: 'META_AUDIENCE' })}
                        icon={<Users size={16} className="text-blue-400" />}
                        label="Añadir Audiencia Ads"
                        color="bg-blue-950/40 border-blue-700/80 text-blue-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Generate Invoice', { actionType: 'GENERATE_INVOICE' })}
                        icon={<FileText size={16} className="text-indigo-400" />}
                        label="Generar Factura"
                        color="bg-indigo-950/40 border-indigo-700/80 text-indigo-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Validate Data', { actionType: 'VALIDATE_DATA' })}
                        icon={<ShieldCheck size={16} className="text-emerald-400" />}
                        label="Validar Email/Teléfono"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'crmActionNode', 'Add Tag', { actionType: 'ADD_TAG' })}
                        icon={<Tags size={16} className="text-emerald-400" />}
                        label="Añadir Etiqueta"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                </Section>

                {/* Communication Section */}
                <Section title="Canales & Comunicación" description="Mensajería y notificaciones">
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'actionNode', 'Send Email')}
                        icon={<Mail size={16} className="text-indigo-400" />}
                        label="Enviar Email"
                        color="bg-indigo-950/40 border-indigo-700/80 text-indigo-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'whatsappNode', 'WhatsApp Msg')}
                        icon={<Phone size={16} className="text-green-400" />}
                        label="Enviar WhatsApp"
                        color="bg-green-950/40 border-green-700/80 text-green-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'socialNode', 'IG Direct Message', { channel: 'IG_DM' })}
                        icon={<MessageSquare size={16} className="text-pink-400" />}
                        label="Enviar IG Direct"
                        color="bg-pink-950/40 border-pink-700/80 text-pink-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'phoneCallNode', 'AI Voice Call')}
                        icon={<PhoneCall size={16} className="text-violet-400" />}
                        label="Llamada IA (Vapi/Twilio)"
                        color="bg-violet-950/40 border-violet-700/80 text-violet-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'pushNode', 'Push Notification')}
                        icon={<Bell size={16} className="text-amber-400" />}
                        label="Enviar Notificación Push"
                        color="bg-amber-950/40 border-amber-700/80 text-amber-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'socialNode', 'Reply Comment', { channel: 'SOCIAL_COMMENT' })}
                        icon={<MessageSquare size={16} className="text-blue-500" />}
                        label="Responder Comentario"
                        color="bg-blue-950/40 border-blue-700/80 text-blue-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'smsNode', 'Send SMS')}
                        icon={<Smartphone size={16} className="text-sky-400" />}
                        label="Enviar SMS"
                        color="bg-sky-950/40 border-sky-700/80 text-sky-50"
                    />

                </Section>

                {/* Logic Section */}
                <Section title="Lógica, Transformación & IA" description="Control de flujo e integraciones">
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'waitNode', 'Wait / Delay', { delayValue: '1', delayUnit: 'h' })}
                        icon={<Clock size={16} className="text-orange-400" />}
                        label="Espera / Retraso"
                        color="bg-orange-950/40 border-orange-700/80 text-orange-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'splitNode', 'A/B Split Test')}
                        icon={<ArrowLeftRight size={16} className="text-fuchsia-400" />}
                        label="Split A/B Test"
                        color="bg-fuchsia-950/40 border-fuchsia-700/80 text-fuchsia-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'conditionNode', 'Condition (If/Else)')}
                        icon={<Split size={16} className="text-slate-400" />}
                        label="Condición (Si/Sino)"
                        color="bg-slate-800/80 border-slate-600 text-white"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'switchNode', 'Switch (Múltiples caminos)')}
                        icon={<GitBranch size={16} className="text-indigo-400" />}
                        label="Switch (Múltiples)"
                        color="bg-indigo-950/40 border-indigo-700/80 text-indigo-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'aiNode', 'Intent Classifier', { aiTask: 'CLASSIFY_INTENT' })}
                        icon={<Sparkles size={16} className="text-yellow-400" />}
                        label="Clasificar Intención (IA)"
                        color="bg-yellow-950/40 border-yellow-700/80 text-yellow-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'transformerNode', 'Transform Data')}
                        icon={<Layers size={16} className="text-teal-400" />}
                        label="Transformar Formato"
                        color="bg-teal-950/40 border-teal-700/80 text-teal-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'aiNode', 'AI Translator', { aiTask: 'TRANSLATOR' })}
                        icon={<Globe size={16} className="text-blue-400" />}
                        label="Traductor IA"
                        color="bg-blue-950/40 border-blue-700/80 text-blue-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'enrichmentNode', 'Data Enrichment')}
                        icon={<Database size={16} className="text-emerald-400" />}
                        label="Enriquecer Lead Data"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                </Section>

                {/* Advanced AI & Code Section */}
                <Section title="Agentes IA & Avanzados" description="Procesamiento y Scripts">
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'voiceNode', 'Audio Transcriber')}
                        icon={<Mic size={16} className="text-violet-400" />}
                        label="Transcribir Audio (IA)"
                        color="bg-violet-950/40 border-violet-700/80 text-violet-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'ragNode', 'Knowledge Retrieval')}
                        icon={<BookOpen size={16} className="text-blue-400" />}
                        label="Buscar en Docs (RAG)"
                        color="bg-blue-950/40 border-blue-700/80 text-blue-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'extractorNode', 'Data Extractor')}
                        icon={<FileJson size={16} className="text-amber-400" />}
                        label="Extraer JSON (IA)"
                        color="bg-amber-950/40 border-amber-700/80 text-amber-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'codeNode', 'Run JavaScript')}
                        icon={<Terminal size={16} className="text-white drop-shadow-sm" />}
                        label="Ejecutar Código JS"
                        color="bg-slate-800 border-slate-600 text-white"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'findRecordNode', 'Find Record')}
                        icon={<Search size={16} className="text-emerald-400" />}
                        label="Buscar Contacto"
                        color="bg-emerald-950/40 border-emerald-700/80 text-emerald-50"
                    />
                    <DraggableItem
                        onDragStart={(e) => onDragStart(e, 'calendarNode', 'Activity / Calendar')}
                        icon={<CalendarPlus size={16} className="text-rose-400" />}
                        label="Agendar Cita"
                        color="bg-rose-950/40 border-rose-700/80 text-rose-50"
                    />
                </Section>
            </div>
        </aside>
    );
}

// Subcomponents for cleaner code
function Section({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-3">
                <h3 className="text-xs font-bold text-white drop-shadow-sm uppercase tracking-wider">{title}</h3>
                {description && <p className="text-[10px] text-gray-400">{description}</p>}
            </div>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
}

interface DraggableItemProps {
    onDragStart: (event: React.DragEvent) => void;
    icon: React.ReactNode;
    label: string;
    color: string;
}

function DraggableItem({ onDragStart, icon, label, color }: DraggableItemProps) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm hover:shadow-lg shadow-teal-900/10 border-slate-700 ${color}`}
            onDragStart={onDragStart}
            draggable
        >
            <div className="bg-slate-900 p-1.5 rounded-md shadow-sm">
                {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
            <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
