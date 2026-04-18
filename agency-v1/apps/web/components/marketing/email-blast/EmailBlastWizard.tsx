'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, Users, Mail, Send, CheckCircle, XCircle, AlertCircle,
    ChevronRight, ChevronLeft, Loader2, Eye, Paperclip, Save, Library,
    Building2, ShoppingBag, Settings2, Clock, Reply, FileText, List, X
} from 'lucide-react';
import { createEmailBlast } from '@/actions/email-blast';
import { getMailingLists, getListSubscribers } from '@/actions/mailing-list';
import { saveEmailTemplate, getEmailTemplates, getEmailTemplateData, deleteEmailTemplate } from '@/actions/email-template';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import type { EditorRef } from 'react-email-editor';

const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────

type CampaignMode = 'B2B' | 'B2C';
type ToneType = 'formal' | 'professional' | 'friendly' | 'casual';
type SendTimeType = 'now' | 'business_hours' | 'evening' | 'weekend';

interface Recipient {
    email: string;
    name?: string;
    [key: string]: string | undefined;
}

interface AdvancedConfig {
    mode: CampaignMode;
    tone: ToneType;
    replyTo: string;
    includeUnsubscribe: boolean;
    sendTime: SendTimeType;
    // B2B extras
    companyField: string;
    jobTitleField: string;
    industryField: string;
    // B2C extras
    promoCode: string;
    discountField: string;
    cityField: string;
}

interface WizardState {
    name: string;
    subject: string;
    htmlBody: string;
    designJson: any | null;
    useDragAndDrop: boolean;
    isAbTest: boolean;
    subjectB: string;
    htmlBodyB: string;
    fromName: string;
    fromEmail: string;
    listId: string | null;
    scheduledAt: Date | null;
    recipients: Recipient[];
    csvHeaders: string[];
    config: AdvancedConfig;
}

interface SendProgress {
    sent: number;
    failed: number;
    total: number;
    done: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AdvancedConfig = {
    mode: 'B2B',
    tone: 'professional',
    replyTo: '',
    includeUnsubscribe: true,
    sendTime: 'now',
    companyField: 'empresa',
    jobTitleField: 'cargo',
    industryField: 'industria',
    promoCode: '',
    discountField: 'descuento',
    cityField: 'ciudad',
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Recipient[] } {
    // Strip UTF-8 BOM that Excel adds
    const clean = text.replace(/^\uFEFF/, '').trim();
    const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return { headers: [], rows: [] };

    // Auto-detect separator: semicolon (Spanish Excel) or comma
    const firstLine = lines[0];
    const sep = firstLine.includes(';') ? ';' : ',';

    const splitLine = (line: string) =>
        line.split(sep).map((c) => c.trim().replace(/^"|"$/g, '').trim());

    const headers = splitLine(firstLine);
    const rows: Recipient[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = splitLine(lines[i]);
        const row: Recipient = { email: '' };
        headers.forEach((h, idx) => {
            row[h.toLowerCase().trim()] = cols[idx] ?? '';
        });
        // Clean trailing commas/spaces from email
        const emailVal = (row.email ?? '').replace(/[,;]+$/, '').trim();
        row.email = emailVal;
        if (emailVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            rows.push(row);
        }
    }
    return { headers, rows };
}

function buildFinalHtml(html: string, config: AdvancedConfig): string {
    if (!config.includeUnsubscribe) return html;
    const unsubHtml = `
<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:12px;margin:0;">
    © 2026 LegacyMark &nbsp;·&nbsp;
    <a href="{{unsubscribe_url}}" style="color:#0d9488;">Cancelar suscripción</a>
    ${config.mode === 'B2B' ? '&nbsp;·&nbsp; <a href="mailto:' + config.replyTo + '" style="color:#0d9488;">Responder a este correo</a>' : ''}
  </p>
</div>`;
    return html.replace('</body>', unsubHtml + '</body>');
}

// ─── Steps ────────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Segmento', icon: Settings2 },
    { id: 2, label: 'Contactos', icon: Users },
    { id: 3, label: 'Correo', icon: Mail },
    { id: 4, label: 'Preview', icon: Eye },
    { id: 5, label: 'Enviar', icon: Send },
];

// ─── B2B / B2C Mode Panel ─────────────────────────────────────────────────

function ModeSelector({ config, onChange }: { config: AdvancedConfig; onChange: (c: AdvancedConfig) => void }) {
    const modes: { key: CampaignMode; label: string; desc: string; Icon: typeof Building2 }[] = [
        { key: 'B2B', label: 'B2B', desc: 'Empresas y tomadores de decisión', Icon: Building2 },
        { key: 'B2C', label: 'B2C', desc: 'Consumidores finales', Icon: ShoppingBag },
    ];

    const tones: { key: ToneType; label: string }[] = [
        { key: 'formal', label: 'Formal' },
        { key: 'professional', label: 'Profesional' },
        { key: 'friendly', label: 'Amigable' },
        { key: 'casual', label: 'Casual' },
    ];

    const sendTimes: { key: SendTimeType; label: string; desc: string }[] = [
        { key: 'now', label: 'Ahora', desc: 'Envío inmediato' },
        { key: 'business_hours', label: 'Horario laboral', desc: 'Martes-Jueves 9–11am' },
        { key: 'evening', label: 'Noche', desc: 'Lunes-Viernes 7–9pm' },
        { key: 'weekend', label: 'Fin de semana', desc: 'Sábado 10am' },
    ];

    return (
        <div className="space-y-8">
            {/* Mode selector */}
            <div>
                <label className="block text-sm font-black text-white mb-3">Tipo de campaña</label>
                <div className="grid grid-cols-2 gap-4">
                    {modes.map(({ key, label, desc, Icon }) => (
                        <button
                            key={key}
                            onClick={() => onChange({ ...config, mode: key, tone: key === 'B2B' ? 'professional' : 'friendly' })}
                            className="p-5 rounded-2xl text-left transition-all hover:scale-[1.01]"
                            style={{
                                background: config.mode === key ? 'rgba(13,148,136,0.12)' : 'rgba(15,23,42,0.6)',
                                border: config.mode === key ? '2px solid rgba(13,148,136,0.5)' : '1px solid rgba(30,41,59,0.8)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: config.mode === key ? 'rgba(13,148,136,0.2)' : 'rgba(30,41,59,0.6)' }}>
                                    <Icon className="w-5 h-5" style={{ color: config.mode === key ? '#2dd4bf' : '#475569' }} />
                                </div>
                                <span className="font-black text-lg" style={{ color: config.mode === key ? '#2dd4bf' : '#94a3b8' }}>{label}</span>
                            </div>
                            <p className="text-xs text-slate-500">{desc}</p>
                            {key === 'B2B' && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {['Empresa', 'Cargo', 'Industria', 'ROI'].map(t => (
                                        <span key={t} className="text-xs px-2 py-0.5 rounded-lg text-slate-500" style={{ background: 'rgba(30,41,59,0.5)' }}>{t}</span>
                                    ))}
                                </div>
                            )}
                            {key === 'B2C' && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {['Nombre', 'Ciudad', 'Descuento', 'Oferta'].map(t => (
                                        <span key={t} className="text-xs px-2 py-0.5 rounded-lg text-slate-500" style={{ background: 'rgba(30,41,59,0.5)' }}>{t}</span>
                                    ))}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced config grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tone */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-teal-400" /> Tono del correo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {tones.filter(t => {
                            if (config.mode === 'B2B') return ['formal', 'professional'].includes(t.key);
                            return ['friendly', 'casual'].includes(t.key);
                        }).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => onChange({ ...config, tone: key })}
                                className="py-2.5 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    background: config.tone === key ? 'rgba(13,148,136,0.15)' : 'rgba(15,23,42,0.6)',
                                    border: config.tone === key ? '1px solid rgba(13,148,136,0.4)' : '1px solid rgba(30,41,59,0.8)',
                                    color: config.tone === key ? '#2dd4bf' : '#64748b',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Send time */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-teal-400" /> Horario de envío
                    </label>
                    <select
                        value={config.sendTime}
                        onChange={(e) => onChange({ ...config, sendTime: e.target.value as SendTimeType })}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
                    >
                        {sendTimes.map(({ key, label, desc }) => (
                            <option key={key} value={key}>{label} — {desc}</option>
                        ))}
                    </select>
                    {config.sendTime !== 'now' && (
                        <p className="text-xs text-amber-400 mt-1.5">⚠ El envío programado se ejecutará al hacer click en Enviar de todas formas (sin delay real por ahora)</p>
                    )}
                </div>

                {/* Reply-to */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Reply className="w-3.5 h-3.5 text-teal-400" /> Reply-to
                    </label>
                    <input
                        type="email"
                        value={config.replyTo}
                        onChange={(e) => onChange({ ...config, replyTo: e.target.value })}
                        placeholder={config.mode === 'B2B' ? 'ejecutivo@empresa.com' : 'soporte@empresa.com'}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
                        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
                    />
                </div>

                {/* Unsubscribe */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Compliance</label>
                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.6)' }}>
                        <input
                            type="checkbox"
                            checked={config.includeUnsubscribe}
                            onChange={(e) => onChange({ ...config, includeUnsubscribe: e.target.checked })}
                            className="w-4 h-4 accent-teal-500"
                        />
                        <span className="text-sm text-slate-300">Incluir link de cancelación</span>
                        {config.mode === 'B2C' && <span className="text-xs text-red-400 ml-auto">Recomendado</span>}
                    </label>
                </div>
            </div>

            {/* B2B or B2C specific fields */}
            <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                    {config.mode === 'B2B' ? '⚙ Mapeo de campos B2B en tu CSV' : '⚙ Mapeo de campos B2C en tu CSV'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                    {config.mode === 'B2B' ? (
                        <>
                            <InputField label="Col. Empresa" value={config.companyField} onChange={v => onChange({ ...config, companyField: v })} placeholder="empresa" />
                            <InputField label="Col. Cargo" value={config.jobTitleField} onChange={v => onChange({ ...config, jobTitleField: v })} placeholder="cargo" />
                            <InputField label="Col. Industria" value={config.industryField} onChange={v => onChange({ ...config, industryField: v })} placeholder="industria" />
                        </>
                    ) : (
                        <>
                            <InputField label="Col. Ciudad" value={config.cityField} onChange={v => onChange({ ...config, cityField: v })} placeholder="ciudad" />
                            <InputField label="Col. Descuento" value={config.discountField} onChange={v => onChange({ ...config, discountField: v })} placeholder="descuento" />
                            <InputField label="Código Promo" value={config.promoCode} onChange={v => onChange({ ...config, promoCode: v })} placeholder="PROMO20" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div>
            <label className="block text-xs text-slate-500 mb-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-slate-700 outline-none font-mono"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
            />
        </div>
    );
}

// ─── Default templates ────────────────────────────────────────────────────

const B2B_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;}
.container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);}
.header{background:linear-gradient(135deg,#0f172a,#042f2e);padding:36px 40px;display:flex;align-items:center;gap:12px;}
.logo{color:#2dd4bf;font-size:20px;font-weight:900;letter-spacing:-0.5px;}
.badge{background:rgba(13,148,136,0.2);border:1px solid rgba(13,148,136,0.3);color:#2dd4bf;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-left:auto;}
.body{padding:40px;}
h1{color:#0f172a;font-size:24px;font-weight:800;margin:0 0 8px;}
.subtitle{color:#0d9488;font-size:14px;font-weight:600;margin:0 0 20px;}
p{color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;}
.kpi-row{display:flex;gap:16px;margin:24px 0;}
.kpi{flex:1;text-align:center;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;}
.kpi .val{font-size:24px;font-weight:900;color:#0f172a;}
.kpi .lbl{font-size:12px;color:#94a3b8;margin-top:4px;}
.cta{display:inline-block;background:linear-gradient(135deg,#0d9488,#0891b2);color:#fff!important;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-top:8px;}
.footer{background:#f1f5f9;padding:20px 40px;text-align:center;}
.footer p{color:#94a3b8;font-size:12px;margin:0;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">⚡ LegacyMark</div>
    <div class="badge">Comunicación Corporativa</div>
  </div>
  <div class="body">
    <h1>Estimado/a {{name}},</h1>
    <p class="subtitle">{{empresa}} · {{cargo}}</p>
    <p>Le contactamos desde <strong>LegacyMark</strong> con una propuesta diseñada específicamente para empresas del sector <strong>{{industria}}</strong>.</p>
    <p>Hemos trabajado con líderes como usted para optimizar sus procesos de marketing y aumentar el retorno de inversión de manera medible y sostenible.</p>
    <div class="kpi-row">
      <div class="kpi"><div class="val">+320%</div><div class="lbl">ROI Promedio</div></div>
      <div class="kpi"><div class="val">48h</div><div class="lbl">Tiempo de Respuesta</div></div>
      <div class="kpi"><div class="val">100%</div><div class="lbl">Garantía de Resultados</div></div>
    </div>
    <p>¿Le gustaría agendar una llamada de 20 minutos para explorar cómo podríamos colaborar?</p>
    <a href="https://legacymarksas.com/contacto" class="cta">Agendar una reunión →</a>
  </div>
  <div class="footer">
    <p>© 2026 LegacyMark · Girón, Santander · Colombia</p>
    <p style="margin-top:8px;"><a href="{{unsubscribe_url}}" style="color:#0d9488; text-decoration:none;">Cancelar suscripción</a></p>
  </div>
</div>
</body>
</html>`;

const B2C_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;}
.container{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.header{background:linear-gradient(135deg,#0f172a,#042f2e);padding:40px;text-align:center;}
.logo{color:#2dd4bf;font-size:26px;font-weight:900;}
.hero-badge{display:inline-block;background:rgba(13,148,136,0.25);border:1px solid rgba(13,148,136,0.4);color:#2dd4bf;font-size:13px;font-weight:700;padding:6px 18px;border-radius:20px;margin-top:12px;}
.body{padding:40px;}
h1{color:#0f172a;font-size:28px;font-weight:900;margin:0 0 12px;text-align:center;}
p{color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;text-align:center;}
.promo-box{background:linear-gradient(135deg,rgba(13,148,136,0.08),rgba(8,145,178,0.08));border:2px dashed rgba(13,148,136,0.3);border-radius:12px;padding:24px;text-align:center;margin:24px 0;}
.promo-code{font-size:28px;font-weight:900;color:#0d9488;letter-spacing:4px;font-family:monospace;}
.promo-label{color:#64748b;font-size:13px;margin-top:6px;}
.cta{display:block;background:linear-gradient(135deg,#0d9488,#0891b2);color:#fff!important;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:800;font-size:17px;text-align:center;margin-top:16px;}
.footer{background:#f1f5f9;padding:20px 40px;text-align:center;}
.footer p{color:#94a3b8;font-size:12px;margin:0;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">⚡ LegacyMark</div>
    <div class="hero-badge">🎁 Oferta exclusiva para ti</div>
  </div>
  <div class="body">
    <h1>¡Hola {{name}}! 👋</h1>
    <p>Tenemos algo especial para ti en <strong>{{ciudad}}</strong>. Esta oferta es exclusiva y tiene tiempo limitado.</p>
    <div class="promo-box">
      <div class="promo-code">{{descuento}} OFF</div>
      <div class="promo-label">Usa el código: <strong style="color:#0d9488;">{{promo_code}}</strong></div>
    </div>
    <p>No dejes pasar esta oportunidad. Miles de personas ya están aprovechando nuestros servicios con resultados increíbles.</p>
    <a href="https://legacymarksas.com" class="cta">Quiero mi descuento →</a>
  </div>
  <div class="footer"><p>© 2026 LegacyMark · <a href="{{unsubscribe_url}}" style="color:#0d9488;">Cancelar suscripción</a></p></div>
</div>
</body>
</html>`;

// ─── CSV Download helper ────────────────────────────────────────────────────

function CSVTemplateDownload({ mode }: { mode: CampaignMode }) {
    const download = () => {
        const csv = mode === 'B2B'
            ? 'email,name,empresa,cargo,industria\njuan@empresa.com,Juan García,Tech Corp,Director de Marketing,Tecnología\nana@corp.co,Ana López,Fincorp,CEO,Finanzas'
            : 'email,name,ciudad,descuento\njuan@gmail.com,Juan García,Bogotá,30%\nana@hotmail.com,Ana López,Medellín,20%';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_${mode.toLowerCase()}.csv`;
        a.click();
    };
    return (
        <button onClick={download} className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors font-bold">
            <Paperclip className="w-4 h-4" />
            Descargar plantilla CSV {mode}
        </button>
    );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────

export function EmailBlastWizard({ onDone }: { onDone: () => void }) {
    const [step, setStep] = useState(1);
    const [state, setState] = useState<WizardState>({
        name: '',
        subject: '',
        htmlBody: B2B_TEMPLATE,
        designJson: null,
        useDragAndDrop: false,
        isAbTest: false,
        subjectB: '',
        htmlBodyB: '',
        fromName: 'LegacyMark',
        fromEmail: 'noreply@legacymarksas.com',
        listId: null,
        scheduledAt: null,
        recipients: [],
        csvHeaders: [],
        config: DEFAULT_CONFIG,
    });
    const [dragOver, setDragOver] = useState(false);
    const [progress, setProgress] = useState<SendProgress | null>(null);
    const [sending, setSending] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [availableLists, setAvailableLists] = useState<any[]>([]);
    const [listMode, setListMode] = useState<'csv'|'list'>('csv');
    
    // Templates state
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    
    const fileRef = useRef<HTMLInputElement>(null);
    const emailEditorRef = useRef<EditorRef>(null);

    useEffect(() => {
        getMailingLists().then(setAvailableLists).catch(console.error);
    }, []);

    const loadTemplatesList = async () => {
        try {
            const data = await getEmailTemplates();
            setTemplates(data);
        } catch {
            toast.error('Error cargando plantillas');
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateName) return toast.error('Ingresa un nombre para la plantilla');
        const toastId = toast.loading('Guardando plantilla...');
        try {
            // If using visual editor, we need to extract the design JSON and HTML first
            let htmlToSave = state.htmlBody;
            let designToSave = state.designJson;
            
            if (state.useDragAndDrop && emailEditorRef.current?.editor) {
                await new Promise<void>(resolve => {
                    emailEditorRef.current?.editor?.exportHtml((data: any) => {
                        htmlToSave = data.html;
                        designToSave = data.design;
                        resolve();
                    });
                });
            }

            await saveEmailTemplate({
                name: templateName,
                subject: state.subject,
                htmlBody: htmlToSave,
                designJson: designToSave
            });
            setShowSaveTemplate(false);
            setTemplateName('');
            toast.success('Plantilla guardada exitosamente', { id: toastId });
        } catch(e: any) {
            toast.error(e.message || 'Error', { id: toastId });
        }
    };

    const handleLoadTemplate = async (templateId: string) => {
        const toastId = toast.loading('Cargando plantilla...');
        try {
            const tpl = await getEmailTemplateData(templateId);
            
            // Set state
            setState(s => ({
                ...s,
                subject: tpl.subject || s.subject,
                htmlBody: tpl.body || s.htmlBody,
                designJson: tpl.designJson || s.designJson,
                useDragAndDrop: !!tpl.designJson
            }));

            // If switching to Visual Editor, we must wait for it to render
            // and then load the design. The `onLoad` prop will handle it.
            if (tpl.designJson && state.useDragAndDrop && emailEditorRef.current?.editor) {
                emailEditorRef.current.editor.loadDesign(tpl.designJson as any);
            }

            setShowLoadTemplate(false);
            toast.success('Plantilla aplicada', { id: toastId });
        } catch(e: any) {
            toast.error(e.message || 'Error', { id: toastId });
        }
    };

    const handleDeleteTemplate = async (id: string, e: any) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta plantilla?')) return;
        try {
            await deleteEmailTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
            toast.success('Plantilla eliminada');
        } catch {}
    };

    const updateConfig = (config: AdvancedConfig) => {
        setState(s => ({
            ...s,
            config,
            htmlBody: config.mode !== s.config.mode
                ? (config.mode === 'B2B' ? B2B_TEMPLATE : B2C_TEMPLATE)
                : s.htmlBody,
        }));
    };

    const handleFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const { headers, rows } = parseCSV(text);
            setState(s => ({ ...s, csvHeaders: headers, recipients: rows }));
            if (rows.length === 0) toast.error('No se encontraron emails válidos en el CSV');
            else toast.success(`${rows.length} contactos cargados`);
        };
        reader.readAsText(file);
    }, []);

    const handleSend = async () => {
        if (!state.recipients.length || !state.subject || !state.htmlBody) return;
        setSending(true);
        try {
            const finalHtml = buildFinalHtml(state.htmlBody, state.config);
            // 1. Create blast record
            const blast = await createEmailBlast({
                name: state.name || `Campaña ${state.config.mode} ${new Date().toLocaleDateString()}`,
                subject: state.subject,
                htmlBody: finalHtml,
                designJson: state.designJson,
                isAbTest: state.isAbTest,
                subjectB: state.isAbTest ? state.subjectB : undefined,
                fromName: state.fromName,
                fromEmail: state.fromEmail,
                scheduledAt: state.scheduledAt,
                recipients: state.recipients,
            });

            const total = blast.recipients.length;
            setProgress({ sent: 0, failed: 0, total, done: false });

            // 2. Call sendEmailBlast server action directly (avoids NGINX SSE issues)
            const { sendEmailBlast } = await import('@/actions/email-blast');

            // Show animated progress while waiting
            let tick = 0;
            const interval = setInterval(() => {
                tick++;
                const estimated = Math.min(Math.floor((tick / 20) * total), total - 1);
                setProgress(p => p ? { ...p, sent: estimated } : p);
            }, 500);

            const result = await sendEmailBlast(blast.id);
            clearInterval(interval);

            setProgress({ sent: 0, failed: 0, total, done: true });
            toast.success(result.message || 'Campaña encolada');
            setTimeout(() => onDone(), 2500);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[EmailBlast] Error al enviar:', msg);
            toast.error(`Error: ${msg.slice(0, 120)}`);
        } finally {
            setSending(false);
        }
    };

    const canNext = [
        true,
        state.recipients.length > 0 || (listMode === 'list' && state.listId !== null),
        state.subject.length > 2 && state.htmlBody.length > 10,
        true,
        true,
    ][step - 1];

    const inputStyle = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' };
    const inputClass = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none';

    return (
        <div className="w-full">
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-10">
                {STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = s.id === step;
                    const isDone = s.id < step;
                    return (
                        <div key={s.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: isActive ? 'linear-gradient(135deg,#0d9488,#0891b2)' : isDone ? 'rgba(13,148,136,0.2)' : 'rgba(30,41,59,0.6)', border: isActive ? 'none' : isDone ? '1px solid rgba(13,148,136,0.4)' : '1px solid rgba(30,41,59,0.8)' }}>
                                    <Icon className="w-5 h-5" style={{ color: isActive ? '#fff' : isDone ? '#2dd4bf' : '#475569' }} />
                                </div>
                                <span className="text-xs mt-1.5 font-bold" style={{ color: isActive ? '#2dd4bf' : isDone ? '#0d9488' : '#475569' }}>{s.label}</span>
                            </div>
                            {idx < STEPS.length - 1 && <div className="flex-1 h-px mx-2" style={{ background: isDone ? 'rgba(13,148,136,0.4)' : 'rgba(30,41,59,0.6)' }} />}
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Segmento */}
            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Nombre de la campaña</label>
                        <input type="text" value={state.name} onChange={e => setState(s => ({ ...s, name: e.target.value }))} placeholder={`Ej: ${state.config.mode === 'B2B' ? 'Prospección Q2 2026' : 'Promo Temporada Alta'}`} className={inputClass} style={inputStyle} />
                    </div>
                    <ModeSelector config={state.config} onChange={updateConfig} />
                </div>
            )}

            {/* Step 2: Audiencia */}
            {step === 2 && (
                <div className="space-y-5">
                    <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 w-fit mx-auto mb-6">
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${listMode === 'csv' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => { setListMode('csv'); setState(s => ({ ...s, listId: null })); }}>Subir CSV</button>
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${listMode === 'list' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => { setListMode('list'); setState(s => ({ ...s, recipients: [] })); }}>Elegir Lista</button>
                    </div>

                    {listMode === 'list' ? (
                        <div className="space-y-4">
                            {availableLists.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-900/40">
                                    <List className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                                    <p>No tienes listas de audiencia guardadas.</p>
                                    <p className="text-xs mt-1">Sube un CSV o crea una lista en el Administrador de Audiencias.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {availableLists.map(l => (
                                        <div key={l.id} 
                                            onClick={() => setState(s => ({ ...s, listId: l.id }))}
                                            className={`p-5 rounded-xl border cursor-pointer transition-all ${state.listId === l.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                                            <div className="flex items-start justify-between">
                                                <h4 className={`font-bold ${state.listId === l.id ? 'text-teal-400' : 'text-slate-200'}`}>{l.name}</h4>
                                                {state.listId === l.id && <CheckCircle className="w-5 h-5 text-teal-500" />}
                                            </div>
                                            <p className="text-2xl font-black text-white mt-3">{l._count.subscribers}</p>
                                            <p className="text-xs text-slate-500 mt-1">contactos</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div
                                className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all"
                                style={{ borderColor: dragOver ? 'rgba(13,148,136,0.6)' : 'rgba(30,41,59,0.6)', background: dragOver ? 'rgba(13,148,136,0.05)' : 'rgba(15,23,42,0.4)' }}
                                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onClick={() => fileRef.current?.click()}
                            >
                                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                                <Upload className="w-10 h-10 mx-auto mb-4" style={{ color: dragOver ? '#2dd4bf' : '#475569' }} />
                                <p className="text-slate-300 font-bold mb-1">Arrastra tu CSV aquí</p>
                                <p className="text-slate-500 text-xs">Campos {state.config.mode === 'B2B' ? 'recomendados: email, name, empresa, cargo, industria' : 'recomendados: email, name, ciudad, descuento'}</p>
                            </div>
                            {state.recipients.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(30,41,59,0.8)' }}>
                                    <div className="px-5 py-3 flex gap-3 items-center" style={{ background: 'rgba(15,23,42,0.8)' }}>
                                        <Users className="w-4 h-4 text-teal-400" />
                                        <span className="text-sm font-black text-white">{state.recipients.length} contactos válidos</span>
                                        <span className="text-xs text-slate-500 ml-auto">{state.csvHeaders.join(', ')}</span>
                                    </div>
                                    {state.recipients.slice(0, 5).map((r, i) => (
                                        <div key={i} className="px-5 py-2.5 flex gap-4 text-sm" style={{ borderTop: '1px solid rgba(30,41,59,0.4)' }}>
                                            <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-300 font-mono">{r.email}</span>
                                            <span className="text-slate-500">{r.name}</span>
                                            {state.config.mode === 'B2B' && <span className="text-slate-600 text-xs">{r[state.config.companyField]} · {r[state.config.jobTitleField]}</span>}
                                            {state.config.mode === 'B2C' && <span className="text-slate-600 text-xs">{r[state.config.cityField]} · {r[state.config.discountField]}</span>}
                                        </div>
                                    ))}
                                    {state.recipients.length > 5 && <div className="px-5 py-2 text-xs text-slate-600 italic" style={{ borderTop: '1px solid rgba(30,41,59,0.4)' }}>+ {state.recipients.length - 5} más...</div>}
                                </div>
                            )}
                            <CSVTemplateDownload mode={state.config.mode} />
                        </>
                    )}
                </div>
            )}

            {/* Step 3: Email editor */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1.5">Nombre remitente</label>
                            <input type="text" value={state.fromName} onChange={e => setState(s => ({ ...s, fromName: e.target.value }))} className={inputClass} style={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1.5">Email remitente</label>
                            <input type="email" value={state.fromEmail} onChange={e => setState(s => ({ ...s, fromEmail: e.target.value }))} className={inputClass} style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1.5 border-b border-slate-700/50 pb-2">
                            <label className="text-xs font-bold text-slate-400">Asunto</label>
                            <button onClick={() => setState(s => ({ ...s, isAbTest: !s.isAbTest }))} className={`text-xs px-2 py-1 rounded-md font-bold transition-all ${state.isAbTest ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                {state.isAbTest ? 'Prueba A/B Activa' : 'Añadir Prueba A/B'}
                            </button>
                        </div>
                        {state.isAbTest ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Variante A (50%)</label>
                                    <input type="text" value={state.subject} onChange={e => setState(s => ({ ...s, subject: e.target.value }))} className={inputClass} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-xs text-teal-500 mb-1">Variante B (50%)</label>
                                    <input type="text" value={state.subjectB} onChange={e => setState(s => ({ ...s, subjectB: e.target.value }))} placeholder="Escribe un asunto alternativo..." className={inputClass} style={{...inputStyle, borderColor: 'rgba(13,148,136,0.3)'}} />
                                </div>
                            </div>
                        ) : (
                            <input type="text" value={state.subject} onChange={e => setState(s => ({ ...s, subject: e.target.value }))} placeholder={state.config.mode === 'B2B' ? 'Propuesta de colaboración para {{empresa}}' : '¡{{descuento}} de descuento solo para ti, {{name}}! 🎁'} className={inputClass} style={inputStyle} />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-3">
                            <div>
                                <label className="text-xs font-bold text-slate-300">Constructor de Correo</label>
                                <p className="text-xs text-slate-500 mt-0.5">Elige cómo diseñar tu mensaje</p>
                            </div>
                            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                                <button className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!state.useDragAndDrop ? 'bg-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => setState(s => ({ ...s, useDragAndDrop: false }))}>HTML Puro</button>
                                <button className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${state.useDragAndDrop ? 'bg-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`} onClick={() => setState(s => ({ ...s, useDragAndDrop: true }))}>Editor Visual</button>
                            </div>
                        </div>

                        {!state.useDragAndDrop ? (
                            <>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-400">HTML del correo</label>
                                    <span className="text-xs text-teal-500 font-mono">Variables: {'{{'}{state.config.mode === 'B2B' ? 'name, empresa, cargo, industria' : 'name, ciudad, descuento'}{'}}'}</span>
                                </div>
                                <textarea value={state.htmlBody} onChange={e => setState(s => ({ ...s, htmlBody: e.target.value }))} rows={12} className="w-full px-4 py-3 rounded-xl text-xs text-slate-300 font-mono outline-none resize-none" style={inputStyle} />
                                {state.csvHeaders.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {state.csvHeaders.map(h => (
                                            <button key={h} className="text-xs px-2.5 py-1 rounded-lg font-mono text-teal-400" style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}
                                                onClick={() => setState(s => ({ ...s, htmlBody: s.htmlBody + `{{${h.toLowerCase()}}}` }))}>
                                                {`{{${h.toLowerCase()}}}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border border-slate-700/80 rounded-2xl overflow-hidden bg-white" style={{ height: '600px' }}>
                                <EmailEditor 
                                    ref={emailEditorRef} 
                                    onLoad={() => {
                                        if (state.designJson && emailEditorRef.current?.editor) {
                                            emailEditorRef.current.editor.loadDesign(state.designJson);
                                        }
                                    }} 
                                    options={{ features: { textEditor: { spellChecker: true } } }} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
                <div className="space-y-5">
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(30,41,59,0.8)' }}>
                        <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(15,23,42,0.8)' }}>
                            <Mail className="w-4 h-4 text-teal-400" />
                            <div>
                                <p className="text-xs text-slate-500">De: <span className="text-slate-300">{state.fromName}</span>{state.config.replyTo && <span className="text-slate-600"> · Reply-to: {state.config.replyTo}</span>}</p>
                                <p className="text-xs text-slate-500">Asunto: <span className="text-slate-300 font-bold">{state.subject}</span></p>
                                <p className="text-xs text-slate-600">Tono: {state.config.tone} · {state.config.mode} · {state.recipients.length} destinatarios</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-b-2xl overflow-hidden">
                            <iframe srcDoc={state.htmlBody} className="w-full border-0" style={{ height: 380 }} title="Preview" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="tu@email.com" className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none" style={inputStyle} />
                        <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 transition-all hover:text-white" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}
                            onClick={async () => { if (!testEmail) return; const { sendTestEmail } = await import('@/actions/email-blast'); await sendTestEmail(state.subject, state.htmlBody, testEmail); toast.success(`Prueba enviada a ${testEmail}`); }}>
                            Enviar prueba
                        </button>
                    </div>
                    <div className="rounded-xl p-4 flex gap-3" style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)' }}>
                        <AlertCircle className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-400"><strong className="text-white">{state.recipients.length} correos</strong> en modo <strong className="text-teal-400">{state.config.mode}</strong> · Tono: {state.config.tone} · {state.config.includeUnsubscribe ? 'Con link de cancelación' : 'Sin link de cancelación'}</p>
                    </div>
                </div>
            )}

            {/* Step 5: Send */}
            {step === 5 && (
                <div className="space-y-8">
                    {!progress ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.2),rgba(8,145,178,0.2))', border: '1px solid rgba(13,148,136,0.3)' }}>
                                {state.config.mode === 'B2B' ? <Building2 className="w-9 h-9 text-teal-400" /> : <ShoppingBag className="w-9 h-9 text-teal-400" />}
                            </div>
                            <h3 className="text-2xl font-black text-white mb-1">Todo listo para enviar</h3>
                            <p className="text-slate-400"><strong className="text-white">{state.recipients.length}</strong> destinatarios · Modo <span className="text-teal-400 font-bold">{state.config.mode}</span></p>
                            <p className="text-slate-500 text-sm mt-1 mb-6">Tono: {state.config.tone} · {state.config.includeUnsubscribe ? 'Link de cancelación incluido' : 'Sin link de cancelación'}</p>

                            <div className="mx-auto max-w-sm text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-teal-400"/> Programar envío (Opcional)</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none" 
                                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
                                    value={state.scheduledAt ? new Date(state.scheduledAt.getTime() - state.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''} 
                                    onChange={e => setState(s => ({ ...s, scheduledAt: e.target.value ? new Date(e.target.value) : null }))} 
                                />
                                <p className="text-xs text-slate-500 mt-2">Déjalo en blanco para encolar el envío inmediatamente.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                {progress.done ? <CheckCircle className="w-14 h-14 mx-auto text-teal-400 mb-3" /> : <Loader2 className="w-14 h-14 mx-auto text-teal-400 animate-spin mb-3" />}
                                <p className="text-xl font-black text-white">{progress.done ? '¡Campaña enviada!' : 'Enviando...'}</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Progreso</span><span>{progress.sent + progress.failed} / {progress.total}</span></div>
                                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%`, background: 'linear-gradient(90deg,#0d9488,#0891b2)' }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                    <p className="text-3xl font-black text-teal-400">{progress.sent}</p>
                                    <p className="text-xs text-slate-500 mt-1">Enviados</p>
                                </div>
                                <div className="rounded-xl p-4 text-center" style={{ background: progress.failed > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(30,41,59,0.4)', border: progress.failed > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(30,41,59,0.6)' }}>
                                    <p className="text-3xl font-black" style={{ color: progress.failed > 0 ? '#f87171' : '#475569' }}>{progress.failed}</p>
                                    <p className="text-xs text-slate-500 mt-1">Fallidos</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }}>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 transition-all hover:text-white disabled:opacity-30" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)' }} onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || sending}>
                    <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
                {step < 5 ? (
                    <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40" style={{ background: canNext ? 'linear-gradient(135deg,#0d9488,#0891b2)' : 'rgba(30,41,59,0.5)', cursor: canNext ? 'pointer' : 'not-allowed' }} 
                        onClick={() => {
                            if (!canNext) return;
                            if (step === 2 && listMode === 'list' && state.listId) {
                                const toastId = toast.loading('Cargando suscriptores...');
                                getListSubscribers(state.listId).then((subs: any[]) => {
                                    if (subs.length === 0) {
                                        toast.error('La lista no tiene suscriptores válidos', { id: toastId });
                                        return;
                                    }
                                    const recipients = subs.map((s: any) => ({ email: s.email, name: s.name || '', ...((s.variables as any) || {}) }));
                                    setState(s => ({ ...s, recipients, csvHeaders: ['email', 'name', 'status'] }));
                                    toast.success(`${subs.length} suscriptores cargados`, { id: toastId });
                                    setStep(3);
                                }).catch((err: any) => toast.error(err.message, { id: toastId }));
                            } else if (step === 3 && state.useDragAndDrop && emailEditorRef.current?.editor) {
                                emailEditorRef.current.editor.exportHtml((data: any) => {
                                    setState(s => ({ ...s, htmlBody: data.html, designJson: data.design }));
                                    setStep(4);
                                });
                            } else {
                                setStep(s => Math.min(5, s + 1));
                            }
                        }} 
                        disabled={!canNext}>
                        Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40" style={{ background: sending || progress?.done ? 'rgba(30,41,59,0.5)' : 'linear-gradient(135deg,#0d9488,#0891b2)' }} onClick={handleSend} disabled={sending || progress?.done}>
                        {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar campaña</>}
                    </button>
                )}
            </div>
        </div>
    );
}

