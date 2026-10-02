'use client';

import { useState, useEffect } from 'react';
import {
  Target, Users, Zap, ShieldCheck, Share2, FileText, Clock,
  BarChart3, Globe, Sparkles, Plus, CheckCircle2, AlertTriangle,
  ArrowUpRight, RefreshCw, Send, Lock, Layers, Eye, Check
} from 'lucide-react';
import {
  getRFMSmartSegmentsAction,
  getMultiTouchAttributionAction,
  getDomainDeliverabilityAuditAction,
  getSocialPublishingTasksAction,
  createSocialPostTaskAction,
  getSmartFormsAction,
  getSendTimeOptimizationAction,
  getCompetitorBenchmarkingAction,
} from '@/modules/marketing/actions/enterprise-marketing';
import type {
  RFMSmartSegment,
  MultiTouchAttributionReport,
  DomainDeliverabilityAudit,
  SocialChannelPublishingTask,
  SmartFormConfig,
  SendTimeOptimizationProfile,
  CompetitorBenchmarkingRecord,
} from '@/modules/marketing/types';
import { toast } from 'sonner';

export default function EnterpriseMarketingSuitePage() {
  const [activeTab, setActiveTab] = useState<
    'rfm' | 'attribution' | 'deliverability' | 'social' | 'forms' | 'sto' | 'competitive'
  >('rfm');

  const [rfmSegments, setRfmSegments] = useState<RFMSmartSegment[]>([]);
  const [attributionReport, setAttributionReport] = useState<MultiTouchAttributionReport | null>(null);
  const [attributionModel, setAttributionModel] = useState<"FIRST_TOUCH" | "LAST_TOUCH" | "LINEAR" | "W_SHAPED" | "TIME_DECAY">("W_SHAPED");
  const [deliverability, setDeliverability] = useState<DomainDeliverabilityAudit | null>(null);
  const [socialTasks, setSocialTasks] = useState<SocialChannelPublishingTask[]>([]);
  const [smartForms, setSmartForms] = useState<SmartFormConfig[]>([]);
  const [stoProfile, setStoProfile] = useState<SendTimeOptimizationProfile | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorBenchmarkingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Social Post Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<("INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "X_TWITTER" | "TIKTOK")[]>(['LINKEDIN', 'INSTAGRAM', 'FACEBOOK']);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 16));
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  useEffect(() => {
    loadData();
  }, [attributionModel]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rfmRes, attRes, delivRes, socRes, formRes, stoRes, compRes] = await Promise.all([
        getRFMSmartSegmentsAction(),
        getMultiTouchAttributionAction(attributionModel),
        getDomainDeliverabilityAuditAction(),
        getSocialPublishingTasksAction(),
        getSmartFormsAction(),
        getSendTimeOptimizationAction(),
        getCompetitorBenchmarkingAction(),
      ]);

      setRfmSegments(rfmRes);
      setAttributionReport(attRes);
      setDeliverability(delivRes);
      setSocialTasks(socRes);
      setSmartForms(formRes);
      setStoProfile(stoRes);
      setCompetitors(compRes);
    } catch (err) {
      console.error("Error loading enterprise marketing suite data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSocialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent) {
      toast.error("Por favor escribe el contenido de la publicación.");
      return;
    }

    setIsSubmittingPost(true);
    try {
      const res = await createSocialPostTaskAction({
        content: postContent,
        platforms: selectedPlatforms as any,
        scheduledDate: new Date(scheduledDate).toISOString(),
      });

      if (res.success && res.task) {
        setSocialTasks([res.task, ...socialTasks]);
        setShowPostModal(false);
        setPostContent('');
        toast.success("Publicación multicanal programada exitosamente.");
      }
    } catch (_) {
      toast.error("Error al programar publicación.");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="mb-3">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <Sparkles size={10} className="text-teal-400" /> Tier-1 Enterprise Marketing Suite · HubSpot & Marketo Grade
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Suite de Marketing Enterprise & Atribución Multi-Toque
          </h1>
          <p className="ds-subtext mt-1">
            Segmentación Dinámica RFM, Modelos de Atribución ROI, Auditoría SPF/DKIM/DMARC, Publicador Multicanal, Formularios Inteligentes y Benchmarking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Programar Post Multicanal
          </button>
        </div>
      </div>

      {/* Top Banner KPIs */}
      {deliverability && stoProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ds-card p-5 border-teal-500/30 bg-teal-950/15">
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">Reputación de Dominio</span>
            <p className="text-3xl font-black text-white mt-2 font-mono">{deliverability.reputationScore}/100</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 font-semibold">DMARC p=reject estricto</span>
            </div>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Incremento Open-Rate (IA STO)</span>
            <p className="text-3xl font-black text-teal-400 mt-2 font-mono">+{stoProfile.predictedOpenRateBoost}%</p>
            <p className="text-xs text-slate-400 mt-1">Despacho optimizado para {stoProfile.contactsOptimizedCount} contactos.</p>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Riesgo de Spam (Spam Score)</span>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{deliverability.spamRiskScore}%</p>
            <p className="text-xs text-slate-400 mt-1">Entrega directa en Bandeja Principal.</p>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Límite Diario Calentamiento</span>
            <p className="text-3xl font-black text-blue-400 mt-2 font-mono">{deliverability.dailySendLimit.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Día {deliverability.ipWarmupDay} de calentamiento de IP.</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('rfm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rfm'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-teal-400" /> 1. Segmentación RFM Inteligente
        </button>

        <button
          onClick={() => setActiveTab('attribution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'attribution'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-teal-400" /> 2. Atribución Multi-Toque
        </button>

        <button
          onClick={() => setActiveTab('deliverability')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'deliverability'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" /> 3. Entregabilidad & Spam Shield
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'social'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4 text-teal-400" /> 4. Publicador Multicanal
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" /> 5. Formularios & Popups
        </button>

        <button
          onClick={() => setActiveTab('sto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sto'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-teal-400" /> 6. Despacho Predictivo (STO)
        </button>

        <button
          onClick={() => setActiveTab('competitive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'competitive'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-teal-400" /> 7. Inteligencia Competitiva
        </button>
      </div>

      {/* ── TAB 1: RFM SMART SEGMENTS ── */}
      {activeTab === 'rfm' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" /> Segmentación Dinámica RFM (Recency, Frequency, Monetary)
            </h3>
            <p className="text-xs text-slate-400">Clasificación automática de contactos por patrones de compra y frecuencia de interacción.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rfmSegments.map(seg => (
              <div key={seg.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded bg-teal-950 text-teal-400 text-xs font-mono font-bold border border-teal-800/40">
                      {seg.contactsCount} Contactos
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      AOV: ${seg.avgOrderValueUsd} USD
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-3">{seg.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{seg.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Recencia: {seg.recencyScore}/5</span>
                    <span className="text-slate-500">Frecuencia: {seg.frequencyScore}/5</span>
                    <span className="text-slate-500">Monetario: {seg.monetaryScore}/5</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-teal-300 text-[11px]">
                    💡 <strong>Acción:</strong> {seg.recommendedAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: MULTI-TOUCH ATTRIBUTION ── */}
      {activeTab === 'attribution' && attributionReport && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-400" /> Modelos de Atribución Multi-Toque (ROI Real de Marketing)
              </h3>
              <p className="text-xs text-slate-400">Distribución de ingresos generados por canal según el modelo seleccionado.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={attributionModel}
                onChange={(e) => setAttributionModel(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-teal-400 font-bold outline-none"
              >
                <option value="W_SHAPED">Modelo W-Shaped (Recomendado B2B)</option>
                <option value="FIRST_TOUCH">Primer Toque (Descubrimiento)</option>
                <option value="LAST_TOUCH">Último Toque (Cierre)</option>
                <option value="LINEAR">Lineal (Equitativo)</option>
                <option value="TIME_DECAY">Decaimiento Temporal</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {attributionReport.touchpoints.map(tp => (
              <div key={tp.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">{tp.channelName}</h4>
                  <span className="text-slate-500 text-[11px]">Tipo: {tp.channelType} · {tp.conversionsCount} conversiones</span>
                </div>

                <div className="flex items-center gap-8 text-right">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Ingreso Atribuido</span>
                    <span className="text-base font-black text-emerald-400">${tp.attributedRevenueUsd.toLocaleString()} USD</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-slate-500 text-[10px] block">Peso Atribución</span>
                    <span className="text-sm font-bold text-teal-400">{tp.wShapedWeight}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: DELIVERABILITY & SPAM SHIELD ── */}
      {activeTab === 'deliverability' && deliverability && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Protocolos DNS de Entregabilidad
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>SPF (Sender Policy Framework)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  {deliverability.spfStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>DKIM (Clave 2048 bits)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  {deliverability.dkimStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>DMARC (Política de Rechazo)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  {deliverability.dmarcStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>BIMI (Brand Indicators Logo)</span>
                <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-bold border border-teal-500/30">
                  {deliverability.bimiStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Lock className="w-5 h-5 text-emerald-400" /> Escudo Predictivo de Spam (Spam Shield)
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {deliverability.spamShieldFindings.map((f, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-white font-bold">{f.rule}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pl-5">{f.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: OMNICHANNEL SOCIAL PUBLISHING ── */}
      {activeTab === 'social' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-400" /> Publicador Multicanal de Redes Sociales
              </h3>
              <p className="text-xs text-slate-400">Programa publicaciones simultáneas en LinkedIn, Instagram, Facebook, TikTok y X.</p>
            </div>
          </div>

          <div className="space-y-4">
            {socialTasks.map(t => (
              <div key={t.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {t.platforms.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-teal-400 text-[10px] font-mono font-bold border border-slate-800">
                        {p}
                      </span>
                    ))}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    t.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <p className="text-sm text-white font-sans">{t.content}</p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-teal-400">
                  {t.aiGeneratedHashtags.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>

                {t.analytics && t.analytics.impressions > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-6 font-mono text-xs text-slate-400">
                    <span>👁️ {t.analytics.impressions.toLocaleString()} impresiones</span>
                    <span>🖱️ {t.analytics.clicks} clics</span>
                    <span className="text-emerald-400 font-bold">📈 {t.analytics.engagementRate}% engagement</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: SMART FORMS & POPUPS ── */}
      {activeTab === 'forms' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" /> Formularios Inteligentes & Popups Exit-Intent
            </h3>
            <p className="text-xs text-slate-400">Formularios con campos progresivos y popups activados por intención de salida.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {smartForms.map(f => (
              <div key={f.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded bg-teal-950 text-teal-400 text-xs font-mono font-bold border border-teal-800/40">
                    {f.type} · Trigger: {f.triggerCondition}
                  </span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">
                    Conv: {f.conversionRate}% ({f.submissionsCount} leads)
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{f.name}</h4>
                <p className="text-xs text-slate-400">{f.subheadline}</p>

                <div className="space-y-1.5 pt-3 border-t border-slate-800 font-mono text-xs">
                  <span className="text-slate-300 font-bold block">Campos Configurados:</span>
                  {f.fields.map((fld, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg">
                      <span>{fld.label} ({fld.type})</span>
                      <span className="text-teal-400">{fld.isProgressive ? 'Progresivo' : 'Obligatorio'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: SEND-TIME OPTIMIZATION (STO) ── */}
      {activeTab === 'sto' && stoProfile && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" /> Despacho Predictivo por IA (Send-Time Optimization)
            </h3>
            <p className="text-xs text-slate-400">Algoritmo que calcula la ventana horaria de mayor apertura para cada contacto individual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-teal-950/20 border border-teal-500/30 rounded-xl space-y-2">
                <span className="text-teal-400 font-bold block text-sm">Ventana Óptima General Detectada:</span>
                <p className="text-white text-base font-bold">{stoProfile.optimalDayOfWeek} a las 09:00 AM COT</p>
                <p className="text-slate-400 text-[11px]">Zona horaria de referencia: {stoProfile.timeZone}</p>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Contactos con Perfil Horario Activo:</span>
                <span className="text-2xl font-black text-white font-mono">{stoProfile.contactsOptimizedCount}</span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <span className="text-slate-300 font-bold block">Probabilidad de Apertura por Hora:</span>
              {stoProfile.sampleDistribution.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{d.hourLabel}</span>
                    <span className="text-teal-400 font-bold">{d.openProbability}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${d.openProbability}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: COMPETITIVE INTELLIGENCE ── */}
      {activeTab === 'competitive' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-400" /> Radar de Inteligencia Competitiva & Benchmarking
            </h3>
            <p className="text-xs text-slate-400">Monitor de tráfico, volumen de anuncios y oportunidades de brecha de contenido (Content Gap).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {competitors.map(c => (
              <div key={c.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-white">{c.competitorName}</h4>
                    <span className="text-xs font-mono text-slate-500">{c.domain}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    ~{c.estimatedMonthlyVisits.toLocaleString()} visitas/mes
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Keywords Posicionadas</span>
                    <span className="text-sm font-bold text-white">{c.organicKeywordsCount.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Anuncios Activos</span>
                    <span className="text-sm font-bold text-teal-400">{c.activeAdsCount} en Meta/Google</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
                  <span className="text-amber-400 font-bold block">Oportunidades de Content Gap:</span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {c.contentGapOpportunities.map((gap, i) => (
                      <li key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        🎯 {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE SOCIAL POST ── */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Share2 className="w-4 h-4 text-teal-400" />
                Programar Publicación Multicanal
              </h3>
              <button onClick={() => setShowPostModal(false)} className="text-slate-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSocialPost} className="space-y-3">
              <div>
                <label className="text-slate-400 uppercase block">Contenido del Post *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el copy o anuncio para redes sociales..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white mt-1 outline-none focus:border-teal-500 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase block">Fecha y Hora de Publicación</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-teal-400 mt-1 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingPost ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Programar en Redes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
