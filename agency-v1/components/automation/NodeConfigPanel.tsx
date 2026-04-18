"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Settings2, Zap } from 'lucide-react';

interface NodeConfigPanelProps {
    selectedNode: any;
    onChange: (nodeId: string, newData: any) => void;
    onClose: () => void;
}

function Section({ title, icon, children, defaultOpen = true, color = "blue" }: any) {
    const [open, setOpen] = useState(defaultOpen);
    const colors: Record<string, string> = {
        blue: "bg-teal-900/40 border-teal-700/60 text-teal-300",
        purple: "bg-purple-900/40 border-purple-700/60 text-purple-300",
        gray: "bg-slate-800/60 border-slate-700/60 text-slate-400",
    };
    return (
        <div className="border border-slate-700/60 rounded-lg overflow-hidden mb-4">
            <button onClick={() => setOpen(!open)} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider border-b ${colors[color] || colors.blue}`}>
                <span className="flex items-center gap-1.5">{icon}{title}</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open && <div className="p-3 space-y-3 bg-slate-900/80">{children}</div>}
        </div>
    );
}

function Field({ label, hint, children }: any) {
    return (
        <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-300">{label}</Label>
            {children}
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

export default function NodeConfigPanel({ selectedNode, onChange, onClose }: NodeConfigPanelProps) {
    const { id, type, data } = selectedNode;
    const h = (key: string, value: any) => onChange(id, { ...data, [key]: value });

    const renderContent = () => {
        // TRIGGER NODE
        if (type === 'triggerNode') {
            const t = data.triggerType || 'FORM_SUBMISSION';
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Tipo de Disparador">
                        <Select value={t} onValueChange={v => h('triggerType', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FORM_SUBMISSION">Formulario Enviado</SelectItem>
                                <SelectItem value="DEAL_STAGE_CHANGED">Cambio de Etapa Deal</SelectItem>
                                <SelectItem value="LEAD_CREATED">Nuevo Lead Creado</SelectItem>
                                <SelectItem value="SCHEDULE">Horario / Cron</SelectItem>
                                <SelectItem value="WEBHOOK_LISTENER">Escuchar Webhook</SelectItem>
                                <SelectItem value="LEAD_SCORE">Lead Score Alcanzado</SelectItem>
                                <SelectItem value="WHATSAPP_TRIGGER">Mensaje WA Entrante</SelectItem>
                                <SelectItem value="META_LEADS">Lead Meta Ads</SelectItem>
                                <SelectItem value="STRIPE_PAYMENT">Pago Stripe</SelectItem>
                                <SelectItem value="SHOPIFY_ORDER">Orden Shopify</SelectItem>
                                <SelectItem value="EMAIL_LISTENER">Email Recibido</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    {t === 'FORM_SUBMISSION' && <Field label="Origen del Formulario" hint="Ej: Flyering_LeadMagnet (Vacío = Todos)"><Input value={data.formSource||''} onChange={e=>h('formSource',e.target.value)} placeholder="Identificador exacto"/></Field>}
                    {t === 'DEAL_STAGE_CHANGED' && <Field label="Etapa Objetivo"><Select value={data.stage||'WON'} onValueChange={v=>h('stage',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="QUALIFIED">Qualified</SelectItem><SelectItem value="PROPOSAL">Proposal</SelectItem><SelectItem value="NEGOTIATION">Negotiation</SelectItem><SelectItem value="WON">Won</SelectItem></SelectContent></Select></Field>}
                    {t === 'SCHEDULE' && <Field label="Cron Expression" hint="Ej: 0 9 * * 1 (Lunes 9AM)"><Input value={data.cronExpression||''} onChange={e=>h('cronExpression',e.target.value)} placeholder="0 9 * * 1" className="font-mono text-xs"/></Field>}
                    {t === 'WEBHOOK_LISTENER' && <Field label="URL auto-generada"><Input disabled value={`https://legacymark.com/api/webhooks/${id}`} className="font-mono text-xs bg-slate-800 text-slate-500"/></Field>}
                    {t === 'LEAD_SCORE' && <Field label="Score Mínimo"><Input type="number" value={data.targetScore||50} onChange={e=>h('targetScore',e.target.value)}/></Field>}
                    {t === 'WHATSAPP_TRIGGER' && <Field label="Palabra Clave (opcional)" hint="Deja vacío para cualquier mensaje"><Input value={data.keyword||''} onChange={e=>h('keyword',e.target.value)} placeholder="HOLA, PRECIO, DEMO..."/></Field>}
                    {t === 'META_LEADS' && <Field label="Ad Account ID"><Input value={data.adAccountId||''} onChange={e=>h('adAccountId',e.target.value)} placeholder="act_1234567890"/></Field>}
                    {t === 'STRIPE_PAYMENT' && <Field label="Importe mínimo (USD)" hint="0 = cualquier monto"><Input type="number" value={data.minAmount||0} onChange={e=>h('minAmount',e.target.value)}/></Field>}
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Filtro de Formulario (ID)" hint="Sólo activa si viene de este form específico"><Input value={data.formId||''} onChange={e=>h('formId',e.target.value)} placeholder="form_uuid (opcional)"/></Field>
                    <Field label="Reintentos si falla"><Input type="number" value={data.retries||3} onChange={e=>h('retries',e.target.value)}/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.active} onCheckedChange={v=>h('active',v)} id="sw-active"/><Label htmlFor="sw-active" className="text-xs">Trigger Activo</Label></div>
                    <Field label="Notas internas"><Textarea value={data.notes||''} onChange={e=>h('notes',e.target.value)} placeholder="Solo visible en el builder..." className="h-16 text-xs"/></Field>
                </Section>
            </>);
        }

        // CRM ACTION
        if (type === 'crmActionNode') {
            const a = data.actionType || 'CREATE_TASK';
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Tipo de Acción CRM">
                        <Select value={a} onValueChange={v=>h('actionType',v)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CREATE_TASK">Crear Tarea</SelectItem>
                                <SelectItem value="UPDATE_DEAL">Actualizar Deal</SelectItem>
                                <SelectItem value="ADD_TAG">Añadir Etiqueta</SelectItem>
                                <SelectItem value="REMOVE_TAG">Remover Etiqueta</SelectItem>
                                <SelectItem value="ASSIGN_USER">Asignar Usuario</SelectItem>
                                <SelectItem value="ADJUST_SCORE">Ajustar Lead Score</SelectItem>
                                <SelectItem value="META_AUDIENCE">Añadir Audiencia Ads</SelectItem>
                                <SelectItem value="GENERATE_INVOICE">Generar Factura</SelectItem>
                                <SelectItem value="VALIDATE_DATA">Validar Email/Teléfono</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    {a === 'CREATE_TASK' && <><Field label="Título de la tarea"><Input value={data.taskTitle||''} onChange={e=>h('taskTitle',e.target.value)} placeholder="Llamar a {{lead.name}}"/></Field><Field label="Prioridad"><Select value={data.priority||'MEDIUM'} onValueChange={v=>h('priority',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="HIGH">Alta</SelectItem><SelectItem value="MEDIUM">Media</SelectItem><SelectItem value="LOW">Baja</SelectItem></SelectContent></Select></Field></>}
                    {(a === 'ADD_TAG' || a === 'REMOVE_TAG') && <Field label="Nombre de la etiqueta"><Input value={data.tagName||''} onChange={e=>h('tagName',e.target.value)} placeholder="VIP, Hot Lead, etc."/></Field>}
                    {a === 'ASSIGN_USER' && <Field label="ID de Usuario / Round Robin"><Input value={data.userId||''} onChange={e=>h('userId',e.target.value)} placeholder="user_uuid o {{round_robin}}"/></Field>}
                    {a === 'ADJUST_SCORE' && <Field label="Ajuste de Score (+/-)" hint="Use negativo para restar"><Input type="number" value={data.scoreAdj||10} onChange={e=>h('scoreAdj',e.target.value)}/></Field>}
                    {a === 'META_AUDIENCE' && <Field label="Custom Audience ID"><Input value={data.audienceId||''} onChange={e=>h('audienceId',e.target.value)} placeholder="aud_xxxx"/></Field>}
                    {a === 'GENERATE_INVOICE' && <Field label="Monto (USD)"><Input type="number" value={data.amount||''} onChange={e=>h('amount',e.target.value)} placeholder="99.00"/></Field>}
                    {a === 'VALIDATE_DATA' && <Field label="Campo a validar"><Select value={data.validateField||'EMAIL'} onValueChange={v=>h('validateField',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="PHONE">Teléfono</SelectItem><SelectItem value="BOTH">Ambos</SelectItem></SelectContent></Select></Field>}
                    {a === 'UPDATE_DEAL' && <><Field label="Propiedad a actualizar"><Input value={data.dealProperty||''} onChange={e=>h('dealProperty',e.target.value)} placeholder="stage, amount, closeDate..."/></Field><Field label="Nuevo valor"><Input value={data.dealValue||''} onChange={e=>h('dealValue',e.target.value)} placeholder="WON, 5000, {{date}}"/></Field></>}
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Descripción (tarea)" ><Textarea value={data.taskDescription||''} onChange={e=>h('taskDescription',e.target.value)} className="h-16 text-xs" placeholder="Detalles..."/></Field>
                    <Field label="Ejecutar si condición" hint="Deja vacío para ejecutar siempre"><Input value={data.runIf||''} onChange={e=>h('runIf',e.target.value)} placeholder="{{lead.score}} > 80"/></Field>
                    <Field label="Reintentos si falla"><Input type="number" value={data.retries||3} onChange={e=>h('retries',e.target.value)}/></Field>
                    <Field label="Notas internas"><Textarea value={data.notes||''} onChange={e=>h('notes',e.target.value)} className="h-12 text-xs" placeholder="Solo visible en builder..."/></Field>
                </Section>
            </>);
        }

        // EMAIL
        if (type === 'actionNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Asunto"><Input value={data.subject||''} onChange={e=>h('subject',e.target.value)} placeholder="Hola {{lead.name}}!"/></Field>
                    <Field label="Template"><Select value={data.templateId||'blank'} onValueChange={v=>h('templateId',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="blank">HTML Libre</SelectItem><SelectItem value="welcome">Bienvenida</SelectItem><SelectItem value="followup">Seguimiento</SelectItem><SelectItem value="newsletter">Newsletter</SelectItem></SelectContent></Select></Field>
                    <Field label="Cuerpo del Email"><Textarea value={data.body||''} onChange={e=>h('body',e.target.value)} placeholder="Hola {{lead.name}}, ..." className="h-28 font-mono text-xs"/></Field>
                    <Field label="📎 Adjuntar Archivo (PDF URL)" hint="Pega el enlace directo a tu PDF o súbelo al gestor primero"><Input type="url" value={data.pdfAttachmentUrl||''} onChange={e=>h('pdfAttachmentUrl',e.target.value)} placeholder="https://legacymark.com/files/catalogo.pdf" className="text-teal-900 bg-teal-50/50 border-teal-200"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="De (From Name)"><Input value={data.fromName||''} onChange={e=>h('fromName',e.target.value)} placeholder="Equipo LegacyMark"/></Field>
                    <Field label="De (From Email)"><Input value={data.fromEmail||''} onChange={e=>h('fromEmail',e.target.value)} placeholder="noreply@legacymark.com"/></Field>
                    <Field label="CC"><Input value={data.cc||''} onChange={e=>h('cc',e.target.value)} placeholder="manager@empresa.com"/></Field>
                    <Field label="Reply-To"><Input value={data.replyTo||''} onChange={e=>h('replyTo',e.target.value)} placeholder="{{lead.email}}"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.trackOpen} onCheckedChange={v=>h('trackOpen',v)} id="sw-track"/><Label htmlFor="sw-track" className="text-xs">Rastrear aperturas</Label></div>
                    <Field label="Reintentos si falla"><Input type="number" value={data.retries||3} onChange={e=>h('retries',e.target.value)}/></Field>
                </Section>
            </>);
        }

        // WHATSAPP / SMS
        if (type === 'whatsappNode' || type === 'smsNode') {
            const isWA = type === 'whatsappNode';
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Número destino"><Input value={data.phoneNumber||'{{lead.phone}}'} onChange={e=>h('phoneNumber',e.target.value)} placeholder="+1234567890 o {{lead.phone}}" className="font-mono text-xs"/></Field>
                    {isWA && <Field label="Template de WhatsApp (HSM)"><Input value={data.templateName||''} onChange={e=>h('templateName',e.target.value)} placeholder="welcome_v2"/></Field>}
                    <Field label="Mensaje"><Textarea value={data.message||''} onChange={e=>h('message',e.target.value)} placeholder="Hola {{lead.name}}..." className="h-24"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    {isWA && <><Field label="Idioma template"><Input value={data.templateLang||'es'} onChange={e=>h('templateLang',e.target.value)}/></Field><Field label="Variables del template (JSON array)"><Input value={data.templateVars||''} onChange={e=>h('templateVars',e.target.value)} placeholder='["{{lead.name}}","{{deal.amount}}"]' className="font-mono text-xs"/></Field></>}
                    <Field label="Proveedor"><Select value={data.provider||'TWILIO'} onValueChange={v=>h('provider',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="TWILIO">Twilio</SelectItem><SelectItem value="META_API">Meta Cloud API</SelectItem><SelectItem value="VONAGE">Vonage</SelectItem></SelectContent></Select></Field>
                    <Field label="Account SID / API Key"><Input value={data.apiKey||''} onChange={e=>h('apiKey',e.target.value)} placeholder="Dejar vacío = usar global"/></Field>
                    <Field label="Reintentos si falla"><Input type="number" value={data.retries||2} onChange={e=>h('retries',e.target.value)}/></Field>
                </Section>
            </>);
        }

        // SOCIAL NODE (IG DM / Comment)
        if (type === 'socialNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Canal"><Select value={data.channel||'IG_DM'} onValueChange={v=>h('channel',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="IG_DM">Instagram DM</SelectItem><SelectItem value="SOCIAL_COMMENT">Responder Comentario</SelectItem><SelectItem value="FB_MESSENGER">Facebook Messenger</SelectItem></SelectContent></Select></Field>
                    <Field label="Mensaje"><Textarea value={data.message||''} onChange={e=>h('message',e.target.value)} placeholder="Hola! Gracias por tu comentario..." className="h-24"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="ID de Página FB/IG"><Input value={data.pageId||''} onChange={e=>h('pageId',e.target.value)} placeholder="page_12345"/></Field>
                    <Field label="Access Token (override)"><Input value={data.accessToken||''} onChange={e=>h('accessToken',e.target.value)} placeholder="Dejar vacío = usar global"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.likeFirst} onCheckedChange={v=>h('likeFirst',v)} id="sw-like"/><Label htmlFor="sw-like" className="text-xs">Dar like antes de responder</Label></div>
                    <Field label="Reintentos si falla"><Input type="number" value={data.retries||2} onChange={e=>h('retries',e.target.value)}/></Field>
                </Section>
            </>);
        }

        // PHONE CALL NODE
        if (type === 'phoneCallNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Número a llamar"><Input value={data.phoneNumber||'{{lead.phone}}'} onChange={e=>h('phoneNumber',e.target.value)} className="font-mono text-xs"/></Field>
                    <Field label="Agente IA"><Input value={data.agentId||'Sales Bot'} onChange={e=>h('agentId',e.target.value)} placeholder="Nombre del agente configurado"/></Field>
                    <Field label="Sistema Prompt del Agente"><Textarea value={data.systemPrompt||''} onChange={e=>h('systemPrompt',e.target.value)} placeholder="Eres un asesor amable de LegacyMark..." className="h-24 text-xs"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Proveedor de Voz"><Select value={data.voiceProvider||'VAPI'} onValueChange={v=>h('voiceProvider',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="VAPI">Vapi.ai</SelectItem><SelectItem value="TWILIO">Twilio Voice</SelectItem><SelectItem value="BLAND">Bland.ai</SelectItem></SelectContent></Select></Field>
                    <Field label="Voz / Persona"><Select value={data.voice||'SARAH'} onValueChange={v=>h('voice',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SARAH">Sarah (EN, F)</SelectItem><SelectItem value="JORGE">Jorge (ES, M)</SelectItem><SelectItem value="EMMA">Emma (ES, F)</SelectItem></SelectContent></Select></Field>
                    <Field label="Max duración (seg)"><Input type="number" value={data.maxDuration||180} onChange={e=>h('maxDuration',e.target.value)}/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.recordCall} onCheckedChange={v=>h('recordCall',v)} id="sw-rec"/><Label htmlFor="sw-rec" className="text-xs">Grabar llamada</Label></div>
                </Section>
            </>);
        }

        // PUSH NODE
        if (type === 'pushNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Título"><Input value={data.title||''} onChange={e=>h('title',e.target.value)} placeholder="¡Nuevo mensaje!"/></Field>
                    <Field label="Cuerpo"><Textarea value={data.body||''} onChange={e=>h('body',e.target.value)} className="h-20" placeholder="Hola {{lead.name}}, tienes una actualización..."/></Field>
                    <Field label="URL al hacer clic"><Input value={data.clickUrl||''} onChange={e=>h('clickUrl',e.target.value)} placeholder="https://app.legacymark.com/..."/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Icono URL"><Input value={data.iconUrl||''} onChange={e=>h('iconUrl',e.target.value)} placeholder="https://..."/></Field>
                    <Field label="Plataforma"><Select value={data.platform||'ALL'} onValueChange={v=>h('platform',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Web + App</SelectItem><SelectItem value="WEB">Solo Web</SelectItem><SelectItem value="APP">Solo App Móvil</SelectItem></SelectContent></Select></Field>
                    <Field label="Topic / Segmento"><Input value={data.topic||''} onChange={e=>h('topic',e.target.value)} placeholder="todos, vip, nuevos..."/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.silent} onCheckedChange={v=>h('silent',v)} id="sw-silent"/><Label htmlFor="sw-silent" className="text-xs">Notificación silenciosa</Label></div>
                </Section>
            </>);
        }

        // SPLIT A/B
        if (type === 'splitNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Ratio A/B" hint="Suma debe ser 100"><div className="flex gap-2"><div className="flex-1"><Label className="text-xs">Variante A (%)</Label><Input type="number" value={data.ratioA||50} onChange={e=>h('ratioA',e.target.value)}/></div><div className="flex-1"><Label className="text-xs">Variante B (%)</Label><Input type="number" value={data.ratioB||50} onChange={e=>h('ratioB',e.target.value)}/></div></div></Field>
                    <Field label="Métrica de éxito"><Select value={data.metric||'OPEN_RATE'} onValueChange={v=>h('metric',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="OPEN_RATE">Tasa Apertura</SelectItem><SelectItem value="CLICK_RATE">Tasa Clic</SelectItem><SelectItem value="CONVERSION">Conversión</SelectItem></SelectContent></Select></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Nombre Variante A"><Input value={data.labelA||'Control'} onChange={e=>h('labelA',e.target.value)}/></Field>
                    <Field label="Nombre Variante B"><Input value={data.labelB||'Variante'} onChange={e=>h('labelB',e.target.value)}/></Field>
                    <Field label="Duración del test (días)"><Input type="number" value={data.testDuration||7} onChange={e=>h('testDuration',e.target.value)}/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.autoWinner} onCheckedChange={v=>h('autoWinner',v)} id="sw-win"/><Label htmlFor="sw-win" className="text-xs">Auto-seleccionar ganador</Label></div>
                </Section>
            </>);
        }

        // TRANSFORMER NODE
        if (type === 'transformerNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Tipo de Transformación"><Select value={data.formatType||'JSON_TO_PARAMS'} onValueChange={v=>h('formatType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="JSON_TO_PARAMS">JSON → URL Params</SelectItem><SelectItem value="FLATTEN">Aplanar/Flatten</SelectItem><SelectItem value="PICK_FIELDS">Seleccionar Campos</SelectItem><SelectItem value="DATE_FORMAT">Reformatear Fecha</SelectItem><SelectItem value="UPPER_CASE">Texto Mayúsculas</SelectItem></SelectContent></Select></Field>
                    <Field label="Campo de entrada (variable)"><Input value={data.inputVar||''} onChange={e=>h('inputVar',e.target.value)} placeholder="{{trigger.payload}}" className="font-mono text-xs"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Campos a extraer (si PICK_FIELDS)" hint="Separados por coma"><Input value={data.pickFields||''} onChange={e=>h('pickFields',e.target.value)} placeholder="name,email,phone"/></Field>
                    <Field label="Formato Fecha destino (si DATE_FORMAT)"><Input value={data.dateFormat||'DD/MM/YYYY'} onChange={e=>h('dateFormat',e.target.value)} placeholder="DD/MM/YYYY, YYYY-MM-DD"/></Field>
                    <Field label="Variable de salida"><Input value={data.outputVar||'transformed'} onChange={e=>h('outputVar',e.target.value)} className="font-mono text-xs"/></Field>
                    <Field label="Fallback si error"><Input value={data.fallback||''} onChange={e=>h('fallback',e.target.value)} placeholder="Valor por defecto..."/></Field>
                </Section>
            </>);
        }

        // ENRICHMENT NODE
        if (type === 'enrichmentNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Servicio de Enriquecimiento"><Select value={data.service||'CLEARBIT'} onValueChange={v=>h('service',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="CLEARBIT">Clearbit</SelectItem><SelectItem value="APOLLO">Apollo.io</SelectItem><SelectItem value="HUNTER">Hunter.io</SelectItem><SelectItem value="PROXYCURL">ProxyCurl (LinkedIn)</SelectItem></SelectContent></Select></Field>
                    <Field label="Buscar por"><Select value={data.lookupField||'EMAIL'} onValueChange={v=>h('lookupField',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="DOMAIN">Dominio</SelectItem><SelectItem value="LINKEDIN_URL">LinkedIn URL</SelectItem></SelectContent></Select></Field>
                    <Field label="Valor a buscar"><Input value={data.lookupValue||'{{lead.email}}'} onChange={e=>h('lookupValue',e.target.value)} className="font-mono text-xs"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="API Key (override)"><Input value={data.apiKey||''} onChange={e=>h('apiKey',e.target.value)} placeholder="Dejar vacío = usar global"/></Field>
                    <Field label="Campos a guardar en Lead" hint="Separados por coma"><Input value={data.saveFields||'company,jobTitle,linkedinUrl'} onChange={e=>h('saveFields',e.target.value)}/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.overwrite} onCheckedChange={v=>h('overwrite',v)} id="sw-ow"/><Label htmlFor="sw-ow" className="text-xs">Sobreescribir campos existentes</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={!!data.skipIfExists} onCheckedChange={v=>h('skipIfExists',v)} id="sw-skip"/><Label htmlFor="sw-skip" className="text-xs">Saltar si ya tiene datos</Label></div>
                </Section>
            </>);
        }

        // HTTP NODE
        if (type === 'httpNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Método"><Select value={data.method||'POST'} onValueChange={v=>h('method',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="GET">GET</SelectItem><SelectItem value="POST">POST</SelectItem><SelectItem value="PUT">PUT</SelectItem><SelectItem value="PATCH">PATCH</SelectItem><SelectItem value="DELETE">DELETE</SelectItem></SelectContent></Select></Field>
                    <Field label="URL"><Input value={data.url||''} onChange={e=>h('url',e.target.value)} placeholder="https://api.externo.com/v1/data" className="font-mono text-xs"/></Field>
                    <Field label="Body JSON"><Textarea value={data.payload||'{\n  "id": "{{lead.id}}"\n}'} onChange={e=>h('payload',e.target.value)} className="h-28 font-mono text-xs bg-slate-950 text-green-400 border-0"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Headers (JSON)" hint='{"Authorization":"Bearer token"}'><Textarea value={data.headers||'{}'} onChange={e=>h('headers',e.target.value)} className="h-20 font-mono text-xs bg-slate-900 text-blue-300 border-0"/></Field>
                    <Field label="Timeout (ms)"><Input type="number" value={data.timeout||5000} onChange={e=>h('timeout',e.target.value)}/></Field>
                    <Field label="Reintentos si falla"><Input type="number" value={data.retries||3} onChange={e=>h('retries',e.target.value)}/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.followRedirects} onCheckedChange={v=>h('followRedirects',v)} id="sw-red"/><Label htmlFor="sw-red" className="text-xs">Seguir redirecciones</Label></div>
                </Section>
            </>);
        }

        // WAIT NODE
        if (type === 'waitNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <div className="flex gap-2"><div className="w-1/2"><Label className="text-xs font-semibold">Valor</Label><Input type="number" value={data.delayValue||'1'} onChange={e=>h('delayValue',e.target.value)}/></div><div className="w-1/2"><Label className="text-xs font-semibold">Unidad</Label><Select value={data.delayUnit||'h'} onValueChange={v=>h('delayUnit',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="m">Minutos</SelectItem><SelectItem value="h">Horas</SelectItem><SelectItem value="d">Días</SelectItem></SelectContent></Select></div></div>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Tipo de espera"><Select value={data.waitType||'FIXED'} onValueChange={v=>h('waitType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="FIXED">Tiempo fijo</SelectItem><SelectItem value="UNTIL_DATE">Hasta fecha específica</SelectItem><SelectItem value="UNTIL_EVENT">Hasta evento CRM</SelectItem></SelectContent></Select></Field>
                    {data.waitType === 'UNTIL_DATE' && <Field label="Fecha (ISO 8601)"><Input value={data.untilDate||''} onChange={e=>h('untilDate',e.target.value)} placeholder="2025-12-31T09:00:00Z" className="font-mono text-xs"/></Field>}
                    {data.waitType === 'UNTIL_EVENT' && <Field label="Evento a esperar"><Select value={data.untilEvent||'DEAL_WON'} onValueChange={v=>h('untilEvent',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="DEAL_WON">Deal Ganado</SelectItem><SelectItem value="EMAIL_REPLIED">Email Respondido</SelectItem><SelectItem value="PAGE_VISITED">Página Visitada</SelectItem></SelectContent></Select></Field>}
                    <Field label="Max espera (overflow)"><Input type="number" value={data.maxWait||72} onChange={e=>h('maxWait',e.target.value)} placeholder="Horas máx antes de continuar"/></Field>
                </Section>
            </>);
        }

        // CONDITION NODE
        if (type === 'conditionNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Variable a evaluar"><Input value={data.variable||'{{lead.email}}'} onChange={e=>h('variable',e.target.value)} className="font-mono text-xs"/></Field>
                    <Field label="Operador"><Select value={data.operator||'EQUALS'} onValueChange={v=>h('operator',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EQUALS">Igual a</SelectItem><SelectItem value="NOT_EQUALS">No igual a</SelectItem><SelectItem value="CONTAINS">Contiene</SelectItem><SelectItem value="GREATER_THAN">Mayor que</SelectItem><SelectItem value="LESS_THAN">Menor que</SelectItem><SelectItem value="EXISTS">Existe (no vacío)</SelectItem><SelectItem value="NOT_EXISTS">No existe</SelectItem></SelectContent></Select></Field>
                    <Field label="Valor de comparación"><Input value={data.conditionValue||''} onChange={e=>h('conditionValue',e.target.value)} placeholder="Valor a comparar"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Modo de evaluación"><Select value={data.evalMode||'STRICT'} onValueChange={v=>h('evalMode',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="STRICT">Estricto (type + value)</SelectItem><SelectItem value="LOOSE">Flexible (solo value)</SelectItem><SelectItem value="REGEX">Regex</SelectItem></SelectContent></Select></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.caseSensitive} onCheckedChange={v=>h('caseSensitive',v)} id="sw-cs"/><Label htmlFor="sw-cs" className="text-xs">Case Sensitive</Label></div>
                    <Field label="Etiqueta rama VERDADERO"><Input value={data.trueLabel||'Sí'} onChange={e=>h('trueLabel',e.target.value)}/></Field>
                    <Field label="Etiqueta rama FALSO"><Input value={data.falseLabel||'No'} onChange={e=>h('falseLabel',e.target.value)}/></Field>
                </Section>
            </>);
        }

        // SWITCH NODE
        if (type === 'switchNode') {
            const branches = Array.isArray(data.branches) ? data.branches : [{ id: 'case_1', label: 'Case 1', value: 'value1' }, { id: 'case_2', label: 'Case 2', value: 'value2' }];
            const updateBranch = (i: number, key: string, val: string) => { const nb = [...branches]; nb[i] = { ...nb[i], [key]: val }; h('branches', nb); };
            const addBranch = () => h('branches', [...branches, { id: `case_${Date.now()}`, label: `Case ${branches.length + 1}`, value: '' }]);
            const removeBranch = (i: number) => { if (branches.length <= 1) return; const nb = [...branches]; nb.splice(i, 1); h('branches', nb); };
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Variable"><Input value={data.variable||''} onChange={e=>h('variable',e.target.value)} placeholder="{{lead.tier}}" className="font-mono text-xs"/></Field>
                    <div className="space-y-2">
                        <Label className="flex justify-between text-xs font-semibold"><span>Casos</span><Button variant="outline" size="sm" onClick={addBranch} className="h-6 text-xs px-2">+ Añadir</Button></Label>
                        {branches.map((b: any, i: number) => (
                            <div key={b.id||i} className="flex gap-2 items-center bg-slate-800/80 p-2 rounded border">
                                <div className="flex-1 space-y-1"><Input value={b.label} onChange={e=>updateBranch(i,'label',e.target.value)} placeholder={`Etiqueta ${i+1}`} className="h-7 text-xs"/><Input value={b.value} onChange={e=>updateBranch(i,'value',e.target.value)} placeholder="Valor a igualar" className="h-7 text-xs font-mono"/></div>
                                <Button variant="ghost" size="icon" onClick={()=>removeBranch(i)} className="h-7 w-7 text-red-500" disabled={branches.length <= 1}>×</Button>
                            </div>
                        ))}
                    </div>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <div className="flex items-center gap-2"><Switch checked={!!data.hasDefault} onCheckedChange={v=>h('hasDefault',v)} id="sw-def"/><Label htmlFor="sw-def" className="text-xs">Rama por defecto si no coincide</Label></div>
                    <Field label="Etiqueta rama defecto"><Input value={data.defaultLabel||'Otro'} onChange={e=>h('defaultLabel',e.target.value)}/></Field>
                </Section>
            </>);
        }

        // LOOP NODE
        if (type === 'loopNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Variable a iterar (array)" hint="Use {{item}} dentro del loop"><Input value={data.iterableVariable||''} onChange={e=>h('iterableVariable',e.target.value)} placeholder="{{lead.purchases}}" className="font-mono text-xs"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Máximo de iteraciones"><Input type="number" value={data.maxIterations||100} onChange={e=>h('maxIterations',e.target.value)}/></Field>
                    <Field label="Pausa entre iteraciones (ms)"><Input type="number" value={data.iterationDelay||0} onChange={e=>h('iterationDelay',e.target.value)}/></Field>
                    <Field label="Alias del elemento actual"><Input value={data.itemAlias||'item'} onChange={e=>h('itemAlias',e.target.value)} className="font-mono text-xs" placeholder="item"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.continueOnError} onCheckedChange={v=>h('continueOnError',v)} id="sw-coe"/><Label htmlFor="sw-coe" className="text-xs">Continuar si un item falla</Label></div>
                </Section>
            </>);
        }

        // AI NODE
        if (type === 'aiNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Tarea de IA"><Select value={data.aiTask||'SENTIMENT'} onValueChange={v=>h('aiTask',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SENTIMENT">Análisis de Sentimiento</SelectItem><SelectItem value="GENERATION">Generar Texto (Respuesta)</SelectItem><SelectItem value="SUMMARIZE">Resumir Datos</SelectItem><SelectItem value="EXTRACTION">Extraer Info Clave</SelectItem><SelectItem value="CLASSIFY_INTENT">Clasificar Intención</SelectItem><SelectItem value="TRANSLATOR">Traductor</SelectItem></SelectContent></Select></Field>
                    <Field label="Prompt / Instrucción al Agente"><Textarea value={data.promptContext||''} onChange={e=>h('promptContext',e.target.value)} placeholder="Instrucciones adicionales para la IA..." className="h-24 text-xs"/></Field>
                    {data.aiTask === 'TRANSLATOR' && <Field label="Idioma destino"><Select value={data.targetLang||'es'} onValueChange={v=>h('targetLang',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem><SelectItem value="pt">Portugués</SelectItem><SelectItem value="fr">Francés</SelectItem></SelectContent></Select></Field>}
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Modelo LLM"><Select value={data.model||'gemini-2.0-flash'} onValueChange={v=>h('model',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem><SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem><SelectItem value="gpt-4o">GPT-4o</SelectItem><SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem></SelectContent></Select></Field>
                    <Field label="Temperatura (creatividad 0-1)"><Input type="number" step="0.1" min="0" max="1" value={data.temperature||0.3} onChange={e=>h('temperature',e.target.value)}/></Field>
                    <Field label="Variable de entrada"><Input value={data.inputVar||'{{lead.lastMessage}}'} onChange={e=>h('inputVar',e.target.value)} className="font-mono text-xs"/></Field>
                    <Field label="Variable de salida"><Input value={data.outputVar||'aiResult'} onChange={e=>h('outputVar',e.target.value)} className="font-mono text-xs"/></Field>
                    <Field label="Max tokens respuesta"><Input type="number" value={data.maxTokens||500} onChange={e=>h('maxTokens',e.target.value)}/></Field>
                </Section>
            </>);
        }

        // VOICE NODE
        if (type === 'voiceNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="URL del audio" hint="Variable del webhook entrante"><Input value={data.audioUrlVariable||''} onChange={e=>h('audioUrlVariable',e.target.value)} placeholder="{{trigger.mediaUrl}}" className="font-mono text-xs"/></Field>
                    <Field label="Idioma del audio"><Select value={data.lang||'es-ES'} onValueChange={v=>h('lang',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="es-ES">Español</SelectItem><SelectItem value="en-US">Inglés</SelectItem><SelectItem value="pt-BR">Portugués</SelectItem></SelectContent></Select></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Proveedor STT"><Select value={data.sttProvider||'GEMINI'} onValueChange={v=>h('sttProvider',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="GEMINI">Gemini</SelectItem><SelectItem value="WHISPER">OpenAI Whisper</SelectItem><SelectItem value="DEEPGRAM">Deepgram</SelectItem></SelectContent></Select></Field>
                    <Field label="Variable de salida"><Input value={data.outputVar||'transcription'} onChange={e=>h('outputVar',e.target.value)} className="font-mono text-xs"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.punctuation} onCheckedChange={v=>h('punctuation',v)} id="sw-pun"/><Label htmlFor="sw-pun" className="text-xs">Añadir puntuación automática</Label></div>
                </Section>
            </>);
        }

        // RAG NODE
        if (type === 'ragNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Fuente de Documentos"><Select value={data.documentSource||'ALL'} onValueChange={v=>h('documentSource',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todo el Repositorio</SelectItem><SelectItem value="SALES">Manual de Ventas</SelectItem><SelectItem value="SUPPORT">FAQs de Soporte</SelectItem><SelectItem value="LEGAL">Documentos Legales</SelectItem></SelectContent></Select></Field>
                    <Field label="Query / Pregunta"><Textarea value={data.queryVariable||''} onChange={e=>h('queryVariable',e.target.value)} placeholder="{{lead.lastMessage}}" className="h-20 font-mono text-xs"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Número de resultados (K)"><Input type="number" value={data.topK||3} onChange={e=>h('topK',e.target.value)}/></Field>
                    <Field label="Umbral de similaridad (0-1)"><Input type="number" step="0.1" min="0" max="1" value={data.threshold||0.7} onChange={e=>h('threshold',e.target.value)}/></Field>
                    <Field label="Variable de salida"><Input value={data.outputVar||'ragResult'} onChange={e=>h('outputVar',e.target.value)} className="font-mono text-xs"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.citeSources} onCheckedChange={v=>h('citeSources',v)} id="sw-cite"/><Label htmlFor="sw-cite" className="text-xs">Incluir fuentes/citas</Label></div>
                </Section>
            </>);
        }

        // EXTRACTOR NODE
        if (type === 'extractorNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Texto de entrada"><Input value={data.textVariable||''} onChange={e=>h('textVariable',e.target.value)} placeholder="{{lead.lastMessage}}" className="font-mono text-xs"/></Field>
                    <Field label="Esquema JSON esperado"><Textarea value={data.schemaKeys||'{\n  "producto": "string",\n  "cantidad": "number",\n  "urgencia": "alta|media|baja"\n}'} onChange={e=>h('schemaKeys',e.target.value)} className="h-32 font-mono text-xs bg-slate-900 text-amber-400"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Modelo LLM"><Select value={data.model||'gemini-2.0-flash'} onValueChange={v=>h('model',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem><SelectItem value="gpt-4o">GPT-4o</SelectItem></SelectContent></Select></Field>
                    <Field label="Variable de salida"><Input value={data.outputVar||'extracted'} onChange={e=>h('outputVar',e.target.value)} className="font-mono text-xs"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.strict} onCheckedChange={v=>h('strict',v)} id="sw-strict"/><Label htmlFor="sw-strict" className="text-xs">Modo estricto (fallar si no extrae)</Label></div>
                </Section>
            </>);
        }

        // CODE NODE
        if (type === 'codeNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="JavaScript (Node.js)" hint="Accede a: triggerData, workflowData"><Textarea value={data.code||'return {\n  result: true\n};'} onChange={e=>h('code',e.target.value)} className="h-48 font-mono text-xs bg-slate-950 text-green-400 border-slate-700" spellCheck={false}/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Timeout (ms)"><Input type="number" value={data.timeout||5000} onChange={e=>h('timeout',e.target.value)}/></Field>
                    <Field label="Variables de entorno disponibles" hint="Separadas por coma"><Input value={data.envVars||''} onChange={e=>h('envVars',e.target.value)} placeholder="API_KEY, SECRET_TOKEN"/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.asyncMode} onCheckedChange={v=>h('asyncMode',v)} id="sw-async"/><Label htmlFor="sw-async" className="text-xs">Modo async/await</Label></div>
                </Section>
            </>);
        }

        // FIND RECORD NODE
        if (type === 'findRecordNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Buscar Por"><Select value={data.searchBy||'EMAIL'} onValueChange={v=>h('searchBy',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="PHONE">Teléfono</SelectItem><SelectItem value="ID">Lead ID</SelectItem></SelectContent></Select></Field>
                    <Field label="Valor a buscar"><Input value={data.searchValue||''} onChange={e=>h('searchValue',e.target.value)} placeholder="{{trigger.phone}}" className="font-mono text-xs"/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Acción si no encuentra"><Select value={data.notFoundAction||'SKIP'} onValueChange={v=>h('notFoundAction',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SKIP">Saltar (continuar)</SelectItem><SelectItem value="CREATE">Crear nuevo Lead</SelectItem><SelectItem value="FAIL">Detener el flujo</SelectItem></SelectContent></Select></Field>
                    <Field label="Variable de salida"><Input value={data.outputVar||'foundLead'} onChange={e=>h('outputVar',e.target.value)} className="font-mono text-xs"/></Field>
                </Section>
            </>);
        }

        // CALENDAR NODE
        if (type === 'calendarNode') {
            return (<>
                <Section title="Básico" icon={<Zap size={12}/>} color="blue">
                    <Field label="Título del Evento"><Input value={data.eventTitle||'Consultoría Inicial'} onChange={e=>h('eventTitle',e.target.value)}/></Field>
                    <Field label="Email del Invitado"><Input value={data.attendeeEmail||'{{lead.email}}'} onChange={e=>h('attendeeEmail',e.target.value)} className="font-mono text-xs"/></Field>
                    <Field label="Duración (minutos)"><Input type="number" value={data.eventDuration||30} onChange={e=>h('eventDuration',e.target.value)}/></Field>
                </Section>
                <Section title="Avanzado" icon={<Settings2 size={12}/>} color="gray" defaultOpen={false}>
                    <Field label="Descripción del Evento"><Textarea value={data.eventDescription||''} onChange={e=>h('eventDescription',e.target.value)} className="h-20 text-xs"/></Field>
                    <Field label="Ubicación / Link Meet"><Input value={data.location||'Google Meet'} onChange={e=>h('location',e.target.value)}/></Field>
                    <div className="flex items-center gap-2"><Switch checked={!!data.sendInvite} onCheckedChange={v=>h('sendInvite',v)} id="sw-inv"/><Label htmlFor="sw-inv" className="text-xs">Enviar invitación por email</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={!!data.addReminder} onCheckedChange={v=>h('addReminder',v)} id="sw-rem"/><Label htmlFor="sw-rem" className="text-xs">Recordatorio 1h antes</Label></div>
                </Section>
            </>);
        }

        return <div className="text-sm text-slate-500 italic p-4 bg-slate-800/80 rounded">Sin configuración disponible para este tipo de nodo.</div>;
    };

    return (
        <div className="w-80 border-l border-slate-700/60 p-0 bg-slate-900 absolute right-0 top-0 bottom-0 shadow-2xl shadow-black/50 z-20 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-700/60" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)'}}>
                <div>
                    <h3 className="font-bold text-white tracking-tight">Configuración</h3>
                    <p className="text-xs text-teal-400 font-medium">{data.label || 'Propiedades del Nodo'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-slate-700 text-slate-400 hover:text-white">×</Button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar" style={{scrollbarColor:'#334155 #0f172a'}}>
                <div className="mb-4">
                    <Label className="text-xs text-teal-400/70 font-bold mb-1 block uppercase tracking-widest">Nombre del Nodo</Label>
                    <input
                        value={data.label||''}
                        onChange={e=>onChange(id, { ...data, label: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                </div>

                <div className="my-4 border-t border-slate-700/60" />

                {renderContent()}
            </div>

            <div className="p-3 border-t border-slate-700/60 bg-slate-950 text-xs text-slate-500 font-mono text-center truncate">
                ID: {id}
            </div>
        </div>
    );
}
