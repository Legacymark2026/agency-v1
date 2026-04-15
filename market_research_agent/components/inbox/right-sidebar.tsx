'use client';

import { useState, useEffect } from 'react';
import {
    User, MapPin, Mail, Phone, Tag, Clock,
    CreditCard, TrendingUp, AlertCircle, Plus, X, Link, DollarSign, CheckCircle, Copy, Sparkles, Bot, Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelIcon } from './channel-icon';
import { toast } from 'sonner';
import { executeMacro } from '@/actions/inbox';
import { getInboxMacros } from '@/actions/inbox-macros';
import { convertLeadToDeal } from '@/modules/leads/actions/leads';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

// Dark HUD tokens
const D = {
    bg: "rgba(8,12,20,0.98)",
    card: "rgba(15,23,42,0.8)",
    border: "rgba(30,41,59,0.8)",
    textPrimary: "#cbd5e1",
    textMuted: "#334155",
    textDim: "#1e293b",
    teal: "#2dd4bf",
    tealBg: "rgba(13,148,136,0.12)",
    tealBorder: "rgba(13,148,136,0.3)",
    mono: "monospace",
};

export function RightSidebar({ conversation, leadDetails }: { conversation: any, leadDetails?: any }) {
    if (!conversation) return (
        <div style={{ width: "100%", height: "100%", background: D.bg, display: "flex", alignItems: "center", justifyContent: "center", color: D.textMuted, fontSize: "12px", fontFamily: D.mono }}>
            Select a conversation
        </div>
    );

    const lead = leadDetails || conversation.lead || {};
    const leadScore = lead.score || 0;
    const temperature = leadScore > 70 ? 'Hot 🔥' : leadScore > 40 ? 'Warm ☀️' : 'Cold 🧊';
    const tempColor = leadScore > 70 ? '#f87171' : leadScore > 40 ? '#fbbf24' : '#60a5fa';
    const tempBg = leadScore > 70 ? 'rgba(248,113,113,0.12)' : leadScore > 40 ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.12)';

    const [isConverted, setIsConverted] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [savedNotes, setSavedNotes] = useState<string[]>(lead.notes ? [lead.notes] : []);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDealModal, setShowDealModal] = useState(false);
    const [activeTags, setActiveTags] = useState<string[]>(conversation.tags || []);
    const [customFields, setCustomFields] = useState<{ name: string, value: string }[]>([]);
    const [showNewFieldInput, setShowNewFieldInput] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    const [dealValue, setDealValue] = useState('');
    const [dealStage, setDealStage] = useState('NEW');
    const [isCreatingDeal, setIsCreatingDeal] = useState(false);
    
    // Macros State
    const [isExecutingMacro, setIsExecutingMacro] = useState<string | null>(null);
    const [macros, setMacros] = useState<any[]>([]);

    useEffect(() => {
        if (conversation?.companyId) {
            getInboxMacros(conversation.companyId).then(res => {
                if (res.success && res.data) {
                    setMacros(res.data.filter((m: any) => m.isActive));
                }
            });
        }
    }, [conversation?.companyId]);

    // Copilot State
    const [copilotInput, setCopilotInput] = useState('');
    const [isCopilotTyping, setIsCopilotTyping] = useState(false);
    const [copilotMessages, setCopilotMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string }[]>([
        { id: 'welcome', role: 'assistant', content: 'Hola. Soy tu Copiloto IA. ¿En qué te ayudo con esta conversación?' }
    ]);

    const handleCopilotSend = () => {
        if (!copilotInput.trim() || isCopilotTyping) return;
        
        const newMsg = { id: Date.now().toString(), role: 'user' as const, content: copilotInput };
        setCopilotMessages(p => [...p, newMsg]);
        setCopilotInput('');
        setIsCopilotTyping(true);

        // Simulate AI thinking and replying
        setTimeout(() => {
            setCopilotMessages(p => [...p, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Analizando el historial de ${lead.name}... \n\nPuedo sugerirte redactar un correo con el plan Enterprise o marcar este deal como Prioridad Alta. ¿Qué prefieres?`
            }]);
            setIsCopilotTyping(false);
        }, 1500);
    };

    return (
        <div style={{ width: "100%", height: "100%", background: D.bg, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Lead Header */}
            <div style={{ padding: "20px 16px 16px", textAlign: "center", borderBottom: `1px solid ${D.border}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60px", background: `linear-gradient(to bottom, ${D.tealBg}, transparent)` }} />

                <div style={{ width: "68px", height: "68px", margin: "0 auto 12px", borderRadius: "50%", background: `linear-gradient(135deg, #0d9488, #2dd4bf)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", fontWeight: 800, fontFamily: D.mono, position: "relative", border: `2px solid ${D.tealBorder}`, boxShadow: "0 0 20px rgba(13,148,136,0.2)" }}>
                    {lead.name?.substring(0, 2).toUpperCase() || 'UN'}
                    <div style={{ position: "absolute", bottom: "-2px", right: "-2px" }}>
                        <ChannelIcon channel={conversation.channel} className="h-6 w-6 bg-[rgba(8,12,20,0.95)] rounded-full p-1 border border-[rgba(30,41,59,0.9)]" />
                    </div>
                </div>

                <h3 style={{ fontWeight: 800, fontSize: "15px", color: D.textPrimary, marginBottom: "4px", fontFamily: D.mono }}>{lead.name || 'Unknown Lead'}</h3>
                <p style={{ fontSize: "11px", color: D.textMuted, marginBottom: "14px", fontFamily: D.mono }}>{lead.email || 'No email provided'}</p>

                <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <a href={`/dashboard/admin/crm/leads/${lead.id}`} target="_blank" style={{ textDecoration: "none", padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, border: `1px solid ${D.tealBorder}`, background: D.tealBg, color: D.teal, cursor: "pointer", fontFamily: D.mono, display: "flex", alignItems: "center", gap: "5px" }}>
                        <User size={10} /> Profile
                    </a>
                    {lead.convertedToDealId ? (
                        <a href={`/dashboard/admin/crm/deals/${lead.convertedToDealId}`} target="_blank" style={{ textDecoration: "none", padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontFamily: D.mono, display: "flex", alignItems: "center", gap: "5px" }}>
                            <CreditCard size={10} /> Deal
                        </a>
                    ) : (
                        <button style={{ padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontFamily: D.mono, display: "flex", alignItems: "center", gap: "5px" }} onClick={() => setShowDealModal(true)}>
                            <Plus size={10} /> Create Deal
                        </button>
                    )}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button style={{ padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, border: isConverted ? "1px solid rgba(16,185,129,0.3)" : `1px solid ${D.border}`, background: isConverted ? "rgba(16,185,129,0.1)" : D.card, color: isConverted ? "#10b981" : D.textMuted, cursor: "pointer", fontFamily: D.mono, display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => { setIsConverted(true); toast.success('Lead converted!'); }} disabled={isConverted}>
                        {isConverted ? <CheckCircle size={9} /> : <User size={9} />}
                        {isConverted ? 'Converted' : '+ Convert Lead'}
                    </button>
                    <button style={{ padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, border: linkCopied ? `1px solid ${D.tealBorder}` : `1px solid ${D.border}`, background: linkCopied ? D.tealBg : D.card, color: linkCopied ? D.teal : D.textMuted, cursor: "pointer", fontFamily: D.mono, display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => { setLinkCopied(true); toast.success('Payment Link Copied!'); setTimeout(() => setLinkCopied(false), 2000); }}>
                        {linkCopied ? <Copy size={9} /> : <Link size={9} />}
                        {linkCopied ? 'Copied!' : 'Payment Link'}
                    </button>
                </div>
            </div>

            {/* Assignee + Tags */}
            <div style={{ padding: "14px 14px", borderBottom: `1px solid ${D.border}`, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: D.textDim, fontFamily: D.mono }}>Cesionario</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 10px", background: D.card, border: `1px solid ${D.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #2dd4bf)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, fontFamily: D.mono }}>
                                        {conversation.assignee?.name?.substring(0, 2).toUpperCase() || 'UN'}
                                    </div>
                                    <span style={{ fontWeight: 600, color: D.textPrimary, fontFamily: D.mono }}>{conversation.assignee?.name || 'Sin Asignar'}</span>
                                </div>
                                <User size={12} style={{ color: D.textMuted }} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 z-50">
                            <DropdownMenuItem onClick={() => toast.success('Asignado a: Sarah Connor')}>Sarah Connor</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('Asignado a: John Doe')}>John Doe</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => toast.info('Desasignado')}><X size={12} /> Desasignar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: D.textDim, fontFamily: D.mono }}>Etiquetas</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button style={{ background: "none", border: "none", cursor: "pointer", color: D.teal, padding: "2px" }}><Plus size={12} /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {['Ventas', 'Soporte VIP', 'Dudas', 'URGENTE'].filter(t => !activeTags.includes(t)).map(tag => (
                                    <DropdownMenuItem key={tag} onClick={() => { setActiveTags(prev => [...prev, tag]); toast.success(`Etiqueta: ${tag}`); }}>{tag}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {activeTags.length > 0 ? activeTags.map((tag, i) => (
                            <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "99px", fontSize: "10px", fontWeight: 700, color: "#fb7185", fontFamily: D.mono }}>
                                {tag}
                                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#fb7185", padding: 0, display: "flex" }} onClick={() => { setActiveTags(p => p.filter(t => t !== tag)); }}>
                                    <X size={9} />
                                </button>
                            </span>
                        )) : (
                            <span style={{ fontSize: "10px", color: D.textDim, fontFamily: D.mono, fontStyle: "italic" }}>Sin etiquetas</span>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button style={{ display: "flex", alignItems: "center", gap: "3px", padding: "2px 8px", background: "none", border: `1px dashed ${D.border}`, borderRadius: "99px", fontSize: "10px", color: D.textMuted, cursor: "pointer", fontFamily: D.mono }}>
                                    <Plus size={9} /> Añadir
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {['Ventas', 'Soporte VIP', 'Dudas', 'URGENTE'].filter(t => !activeTags.includes(t)).map(tag => (
                                    <DropdownMenuItem key={tag} onClick={() => { setActiveTags(prev => [...prev, tag]); toast.success(`Etiqueta: ${tag}`); }}>{tag}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Lead Score */}
            <div style={{ padding: "14px", borderBottom: `1px solid ${D.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: D.textDim, fontFamily: D.mono }}>Lead Score</span>
                    <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "99px", background: tempBg, color: tempColor, fontFamily: D.mono, border: `1px solid ${tempColor}30` }}>
                        {temperature} ({leadScore})
                    </span>
                </div>
                <div style={{ height: "5px", background: D.card, borderRadius: "99px", overflow: "hidden", border: `1px solid ${D.border}` }}>
                    <div style={{ height: "100%", width: `${leadScore}%`, background: `linear-gradient(to right, ${tempColor}90, ${tempColor})`, borderRadius: "99px", transition: "width 0.5s" }} />
                </div>
                <p style={{ fontSize: "9px", color: D.textDim, marginTop: "6px", textAlign: "right", fontFamily: D.mono }}>Based on recent activity</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
                <TabsList style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderRadius: 0, borderBottom: `1px solid ${D.border}`, background: D.bg, padding: 0, height: "38px", flexShrink: 0 }}>
                    {['details', 'activity', 'notes', 'macros', 'copilot'].map(tab => (
                        <TabsTrigger key={tab} value={tab} style={{ borderRadius: 0, fontSize: "10px", fontFamily: D.mono, fontWeight: 700, textTransform: "capitalize", padding: "0 4px" }}
                            className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:text-teal-400 data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-transparent h-full">
                            {tab === 'activity' ? 'Journey' : tab === 'copilot' ? <span className="flex items-center gap-1 text-indigo-400"><Sparkles size={10} /> Copilot</span> : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="details" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "14px", margin: 0 }}>
                    {/* Contact Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h4 style={{ fontSize: "10px", fontWeight: 800, color: D.textPrimary, display: "flex", alignItems: "center", gap: "6px", fontFamily: D.mono, margin: 0 }}>
                            <User size={12} style={{ color: D.teal }} /> Contact Info
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "18px" }}>
                            {[
                                { icon: Mail, val: lead.email || '-' },
                                { icon: Phone, val: lead.phone || '-' },
                                { icon: MapPin, val: lead.city || 'Unknown Location' },
                            ].map(({ icon: Icon, val }, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                    <Icon size={12} style={{ color: D.textMuted, marginTop: "1px", flexShrink: 0 }} />
                                    <span style={{ fontSize: "11px", color: D.textMuted, fontFamily: D.mono, wordBreak: "break-all" }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: "1px", background: D.border }} />

                    {/* Attribution */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h4 style={{ fontSize: "10px", fontWeight: 800, color: D.textPrimary, display: "flex", alignItems: "center", gap: "6px", fontFamily: D.mono, margin: 0 }}>
                            <TrendingUp size={12} style={{ color: D.teal }} /> Attribution
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {[
                                { label: "Source", val: lead.source || 'Direct' },
                                { label: "Campaign", val: lead.campaign?.name || '-' },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ background: D.card, padding: "8px", borderRadius: "8px", border: `1px solid ${D.border}` }}>
                                    <span style={{ fontSize: "9px", color: D.textDim, display: "block", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: D.mono }}>{label}</span>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: D.textMuted, fontFamily: D.mono }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: "1px", background: D.border }} />

                    {/* Purchase History */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h4 style={{ fontSize: "10px", fontWeight: 800, color: D.textPrimary, display: "flex", alignItems: "center", gap: "6px", fontFamily: D.mono, margin: 0 }}>
                            <DollarSign size={12} style={{ color: "#10b981" }} /> Purchase History
                        </h4>
                        <div style={{ background: "rgba(16,185,129,0.06)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981", fontFamily: D.mono }}>LTV</span>
                                <span style={{ fontSize: "14px", fontWeight: 800, color: "#34d399", fontFamily: D.mono }}>${(lead.score * 12.5 || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "10px", color: "#10b981", fontFamily: D.mono }}>Total Orders</span>
                                <span style={{ fontSize: "10px", fontWeight: 800, color: "#34d399", fontFamily: D.mono }}>{lead.score > 0 ? Math.floor(lead.score / 15) : 0}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: "1px", background: D.border }} />

                    {/* Custom CRM Fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h4 style={{ fontSize: "10px", fontWeight: 800, color: D.textPrimary, display: "flex", alignItems: "center", gap: "6px", fontFamily: D.mono, margin: 0 }}>
                                <AlertCircle size={12} style={{ color: D.textMuted }} /> Campos CRM
                            </h4>
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: D.teal }} onClick={() => setShowNewFieldInput(!showNewFieldInput)}><Plus size={12} /></button>
                        </div>
                        {customFields.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                {customFields.map((f, i) => (
                                    <div key={i} style={{ background: D.card, padding: "7px", borderRadius: "7px", border: `1px solid ${D.border}`, position: "relative" }}>
                                        <button style={{ position: "absolute", top: "3px", right: "3px", background: "none", border: "none", cursor: "pointer", color: "#475569" }} onClick={() => setCustomFields(p => p.filter((_, idx) => idx !== i))}><X size={9} /></button>
                                        <span style={{ fontSize: "9px", color: D.textDim, display: "block", textTransform: "uppercase", fontFamily: D.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "12px" }}>{f.name}</span>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: D.textMuted, fontFamily: D.mono }}>{f.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!customFields.length && !showNewFieldInput && <p style={{ fontSize: "10px", color: D.textDim, fontFamily: D.mono, fontStyle: "italic" }}>No hay campos personalizados.</p>}
                        {showNewFieldInput && (
                            <div style={{ background: D.tealBg, border: `1px solid ${D.tealBorder}`, borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                <input style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: "6px", padding: "6px 8px", fontSize: "11px", color: D.textPrimary, outline: "none", fontFamily: D.mono, width: "100%", boxSizing: "border-box" }} placeholder="Nombre del campo" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} />
                                <input style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: "6px", padding: "6px 8px", fontSize: "11px", color: D.textPrimary, outline: "none", fontFamily: D.mono, width: "100%", boxSizing: "border-box" }} placeholder="Valor" value={newFieldValue} onChange={e => setNewFieldValue(e.target.value)} />
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button style={{ flex: 1, padding: "5px", borderRadius: "6px", border: `1px solid ${D.border}`, background: "transparent", color: D.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: D.mono }} onClick={() => { setShowNewFieldInput(false); setNewFieldName(''); setNewFieldValue(''); }}>Cancelar</button>
                                    <button style={{ flex: 1, padding: "5px", borderRadius: "6px", border: `1px solid ${D.tealBorder}`, background: D.tealBg, color: D.teal, fontSize: "11px", fontWeight: 800, cursor: "pointer", fontFamily: D.mono }} disabled={!newFieldName || !newFieldValue} onClick={() => { setCustomFields(p => [...p, { name: newFieldName, value: newFieldValue }]); setShowNewFieldInput(false); setNewFieldName(''); setNewFieldValue(''); toast.success('Campo agregado'); }}>Guardar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="activity" style={{ padding: "14px" }}>
                    <div style={{ position: "relative", borderLeft: `1px solid ${D.border}`, marginLeft: "8px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        {lead.marketingEvents?.length > 0 ? lead.marketingEvents.map((event: any) => (
                            <div key={event.id} style={{ position: "relative", paddingLeft: "20px" }}>
                                <div style={{ position: "absolute", left: "-5px", top: "3px", width: "9px", height: "9px", borderRadius: "50%", background: event.eventType === 'PAGE_VIEW' ? "#60a5fa" : event.eventType === 'FORM_SUBMIT' ? "#34d399" : "#334155", border: `2px solid ${D.bg}` }} />
                                <p style={{ fontSize: "10px", color: D.textDim, marginBottom: "2px", fontFamily: D.mono }}>{new Date(event.createdAt).toLocaleDateString()}</p>
                                <p style={{ fontSize: "12px", fontWeight: 700, color: D.textPrimary, fontFamily: D.mono }}>{event.eventName || event.eventType}</p>
                                <p style={{ fontSize: "10px", color: D.textMuted, fontFamily: D.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{event.url}</p>
                            </div>
                        )) : (
                            <p style={{ fontSize: "11px", color: D.textDim, paddingLeft: "16px", fontFamily: D.mono, fontStyle: "italic" }}>No recent activity.</p>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="notes" style={{ padding: "14px", display: "flex", flexDirection: "column", height: "400px" }}>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                        {savedNotes.length > 0 ? savedNotes.map((note, idx) => (
                            <div key={idx} style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "8px", padding: "10px", fontSize: "11px", color: D.textMuted, whiteSpace: "pre-wrap", fontFamily: D.mono }}>
                                {note}
                            </div>
                        )) : (
                            <div style={{ fontSize: "11px", color: D.textDim, textAlign: "center", padding: "16px", fontFamily: D.mono, fontStyle: "italic" }}>No notes yet.</div>
                        )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        <textarea
                            style={{ width: "100%", background: D.card, border: `1px solid ${D.border}`, borderRadius: "8px", padding: "10px", fontSize: "11px", color: D.textPrimary, outline: "none", minHeight: "80px", resize: "none", marginBottom: "8px", fontFamily: D.mono, boxSizing: "border-box" }}
                            placeholder="Type a new internal note..."
                            value={noteDraft}
                            onChange={e => setNoteDraft(e.target.value)}
                        />
                        <button
                            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${D.tealBorder}`, background: noteDraft.trim() ? D.tealBg : "transparent", color: noteDraft.trim() ? D.teal : D.textDim, fontSize: "12px", fontWeight: 800, cursor: noteDraft.trim() ? "pointer" : "not-allowed", fontFamily: D.mono, transition: "all 0.15s" }}
                            disabled={!noteDraft.trim()}
                            onClick={() => { setSavedNotes(p => [...p, noteDraft]); setNoteDraft(''); toast.success('Note saved'); }}
                        >
                            Save Note
                        </button>
                    </div>
                </TabsContent>

                <TabsContent value="macros" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", margin: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <h4 style={{ fontSize: "10px", fontWeight: 800, color: D.textPrimary, fontFamily: D.mono, margin: 0 }}>Acciones de 1-Click</h4>
                        <button style={{ fontSize: "9px", background: "none", border: "none", color: D.teal, cursor: "pointer", fontFamily: D.mono }}>+ Nuevo</button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {macros.length === 0 ? (
                            <div style={{ fontSize: "11px", color: D.textDim, textAlign: "center", padding: "16px", fontFamily: D.mono, fontStyle: "italic" }}>
                                No hay macros activas configuradas.
                            </div>
                        ) : macros.map(macro => (
                            <div key={macro.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px", position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", backgroundColor: macro.color || '#10b981' }} />
                                
                                <div>
                                    <h5 style={{ fontSize: "12px", fontWeight: 700, color: D.textPrimary, margin: "0 0 2px 0", fontFamily: D.mono }}>{macro.title}</h5>
                                    <p style={{ fontSize: "10px", color: D.textMuted, margin: 0, fontFamily: D.mono, lineHeight: 1.2 }}>{macro.description || 'Action'}</p>
                                </div>
                                
                                <button 
                                    style={{ width: "100%", padding: "6px", borderRadius: "6px", border: `1px solid ${macro.color || '#10b981'}40`, background: `${macro.color || '#10b981'}15`, color: macro.color || '#10b981', fontSize: "11px", fontWeight: 800, cursor: isExecutingMacro === macro.id ? "wait" : "pointer", fontFamily: D.mono, transition: "all 0.2s" }}
                                    disabled={isExecutingMacro !== null}
                                    onClick={async () => {
                                        setIsExecutingMacro(macro.id);
                                        const tId = toast.loading(`Ejecutando ${macro.title}...`);
                                        const res = await executeMacro(conversation.id, macro.id);
                                        if (res.success) {
                                            toast.success('Macro ejecutado correctamente', { id: tId });
                                        } else {
                                            toast.error(res.error || 'Error al ejecutar macro', { id: tId });
                                        }
                                        setIsExecutingMacro(null);
                                    }}
                                >
                                    {isExecutingMacro === macro.id ? 'Ejecutando...' : 'Ejecutar'}
                                </button>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="copilot" style={{ padding: 0, margin: 0, display: "flex", flexDirection: "column", height: "100%" }}>
                    {/* Embedded AI Copilot Chat */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "12px", background: "linear-gradient(to bottom, rgba(79,70,229,0.02), rgba(0,0,0,0))" }}>
                        <div style={{ textAlign: "center", marginBottom: "8px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.2)", padding: "4px 10px", borderRadius: "99px", color: "#818cf8", fontSize: "10px", fontWeight: 800, fontFamily: D.mono }}>
                                <Sparkles size={10} /> Copilot Agent Online
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {copilotMessages.map(msg => (
                                <motion.div 
                                    key={msg.id} 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="flex gap-2"
                                    style={{ flexDirection: msg.role === 'user' ? "row-reverse" : "row" }}
                                >
                                    <div style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: msg.role === 'user' ? D.tealBg : "rgba(79,70,229,0.1)", border: msg.role === 'user' ? `1px solid ${D.tealBorder}` : "1px solid rgba(79,70,229,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: msg.role === 'user' ? D.teal : "#818cf8" }}>
                                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div style={{ background: msg.role === 'user' ? "rgba(13,148,136,0.1)" : "rgba(15,23,42,0.6)", border: msg.role === 'user' ? `1px solid ${D.tealBorder}` : `1px solid ${D.border}`, padding: "10px", borderRadius: "10px", borderTopLeftRadius: msg.role === 'assistant' ? 0 : "10px", borderTopRightRadius: msg.role === 'user' ? 0 : "10px", fontSize: "11px", color: D.textPrimary, fontFamily: "sans-serif", lineHeight: 1.5, maxWidth: "85%", whiteSpace: "pre-wrap" }}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isCopilotTyping && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex gap-2"
                                >
                                    <div style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
                                        <Bot size={12} />
                                    </div>
                                    <div style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${D.border}`, padding: "10px", borderRadius: "10px", borderTopLeftRadius: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#818cf8", animation: "pulse 1.5s infinite 0s" }} />
                                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#818cf8", animation: "pulse 1.5s infinite 0.2s" }} />
                                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#818cf8", animation: "pulse 1.5s infinite 0.4s" }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <div style={{ padding: "12px", borderTop: `1px solid ${D.border}`, background: "rgba(8,12,20,0.95)" }}>
                        <div style={{ display: "flex", gap: "8px", background: D.card, border: `1px solid ${D.border}`, borderRadius: "10px", padding: "4px", transition: "all 0.2s" }}>
                            <input 
                                type="text"
                                value={copilotInput}
                                onChange={e => setCopilotInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCopilotSend()}
                                placeholder="Pide a la IA que analice o redacte..."
                                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "11px", color: D.textPrimary, padding: "8px", fontFamily: D.mono }}
                            />
                            <button 
                                onClick={handleCopilotSend}
                                disabled={!copilotInput.trim() || isCopilotTyping}
                                style={{ background: copilotInput.trim() ? "linear-gradient(135deg, #4f46e5, #6366f1)" : D.bg, border: "none", borderRadius: "6px", width: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: copilotInput.trim() ? "white" : D.border, cursor: copilotInput.trim() && !isCopilotTyping ? "pointer" : "default", transition: "all 0.2s" }}
                            >
                                <Send size={12} style={{ marginLeft: "-2px" }} />
                            </button>
                        </div>
                    </div>
                </TabsContent>
                </div>
            </Tabs>

            {/* Modals */}
            {showProfileModal && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ background: "rgba(11,15,25,0.98)", border: `1px solid ${D.border}`, borderRadius: "16px", width: "100%", maxWidth: "340px", overflow: "hidden" }}>
                        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${D.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,12,20,0.9)" }}>
                            <h3 style={{ fontWeight: 800, color: D.textPrimary, fontSize: "14px", fontFamily: D.mono, margin: 0 }}>CRM Profile</h3>
                            <button onClick={() => setShowProfileModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: D.textMuted }}><X size={14} /></button>
                        </div>
                        <div style={{ padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg, #0d9488, #2dd4bf)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "18px", fontWeight: 800, fontFamily: D.mono }}>
                                {lead.name?.substring(0, 2).toUpperCase() || 'UN'}
                            </div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: "15px", color: D.textPrimary, fontFamily: D.mono, margin: 0 }}>{lead.name}</p>
                                <p style={{ fontSize: "11px", color: D.textMuted, fontFamily: D.mono }}>{lead.email}</p>
                            </div>
                            <button style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${D.tealBorder}`, background: D.tealBg, color: D.teal, fontSize: "12px", fontWeight: 800, cursor: "pointer", fontFamily: D.mono }} onClick={() => setShowProfileModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showDealModal && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ background: "rgba(11,15,25,0.98)", border: `1px solid ${D.border}`, borderRadius: "16px", width: "100%", maxWidth: "340px", overflow: "hidden" }}>
                        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${D.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,12,20,0.9)" }}>
                            <h3 style={{ fontWeight: 800, color: D.textPrimary, fontSize: "14px", fontFamily: D.mono, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><CreditCard size={13} style={{ color: "#10b981" }} /> Create Deal</h3>
                            <button onClick={() => setShowDealModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: D.textMuted }}><X size={14} /></button>
                        </div>
                        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: D.textDim, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: D.mono, display: "block", marginBottom: "5px" }}>Deal Value ($)</label>
                                <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} style={{ width: "100%", background: D.card, border: `1px solid ${D.border}`, borderRadius: "7px", padding: "7px 10px", fontSize: "12px", color: D.textPrimary, outline: "none", fontFamily: D.mono, boxSizing: "border-box" }} placeholder="e.g. 5000" />
                            </div>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: D.textDim, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: D.mono, display: "block", marginBottom: "5px" }}>Pipeline Stage</label>
                                <select value={dealStage} onChange={e => setDealStage(e.target.value)} style={{ width: "100%", background: D.card, border: `1px solid ${D.border}`, borderRadius: "7px", padding: "7px 10px", fontSize: "12px", color: D.textPrimary, outline: "none", fontFamily: D.mono, boxSizing: "border-box" }}>
                                    <option value="NEW">New (Prospecting)</option>
                                    <option value="PROPOSAL">Proposal Made</option>
                                    <option value="NEGOTIATION">In Negotiation</option>
                                </select>
                            </div>
                            <button style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.12)", color: "#10b981", fontSize: "12px", fontWeight: 800, cursor: isCreatingDeal ? "wait" : "pointer", fontFamily: D.mono, opacity: isCreatingDeal ? 0.6 : 1 }} disabled={isCreatingDeal} onClick={async () => {
                                setIsCreatingDeal(true);
                                const result = await convertLeadToDeal(lead.id, {
                                    title: `Deal: ${lead.name || lead.email}`,
                                    value: Number(dealValue) || 0,
                                    stage: dealStage
                                });
                                if (result.success) {
                                    toast.success('Deal Created in Pipeline!');
                                    setShowDealModal(false);
                                    lead.convertedToDealId = result.data?.id; // optimistic
                                } else {
                                    toast.error(result.error || 'Failed to create Deal');
                                }
                                setIsCreatingDeal(false);
                            }}>
                                {isCreatingDeal ? 'Creating...' : 'Save Deal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
