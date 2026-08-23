'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, Target, Users, Briefcase, FileText, DollarSign,
  Sparkles, CheckCircle2, AlertCircle, Clock, ShieldCheck, Plus,
  Layers, ChevronRight, Award, Zap, Building2, UserCheck, Check,
  Workflow, ArrowUpRight, BarChart3, RefreshCw, Send, Lock, BookOpen
} from 'lucide-react';
import {
  getCPQBundlesAction,
  createCPQQuoteAction,
  getCPQQuotesAction,
  getB2BAccountsAction,
  getSalesQuotasLeaderboardAction,
  getSalesPlaybooksAction,
  getSalesCadencesAction,
  getContractsCLMAction,
  getAIUpsellRecommendationsAction,
} from '@/modules/commercial/actions/commercial';
import type {
  CPQProductBundle,
  CPQQuoteRecord,
  B2BAccountRecord,
  SalesRepQuota,
  SalesForecastSummary,
  SalesPlaybook,
  SalesCadence,
  CommercialContractRecord,
  AIUpsellRecommendation,
} from '@/modules/commercial/types';
import { toast } from 'sonner';

export default function EnterpriseCommercialHubPage() {
  const [activeTab, setActiveTab] = useState<
    'cpq' | 'accounts' | 'quotas' | 'playbooks' | 'cadences' | 'contracts' | 'upsell'
  >('cpq');

  const [bundles, setBundles] = useState<CPQProductBundle[]>([]);
  const [quotes, setQuotes] = useState<CPQQuoteRecord[]>([]);
  const [accounts, setAccounts] = useState<B2BAccountRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<SalesRepQuota[]>([]);
  const [forecastSummary, setForecastSummary] = useState<SalesForecastSummary | null>(null);
  const [playbooks, setPlaybooks] = useState<SalesPlaybook[]>([]);
  const [cadences, setCadences] = useState<SalesCadence[]>([]);
  const [contractsData, setContractsData] = useState<{ contracts: CommercialContractRecord[]; totalMRR: number; totalARR: number; churnRate: number } | null>(null);
  const [upsellRecs, setUpsellRecs] = useState<AIUpsellRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New CPQ Quote Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAccountName, setQuoteAccountName] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState(1);
  const [quoteDiscount, setQuoteDiscount] = useState(10);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bunRes, qotRes, accRes, quotaRes, pbRes, cadRes, clmRes, upRes] = await Promise.all([
        getCPQBundlesAction(),
        getCPQQuotesAction(),
        getB2BAccountsAction(),
        getSalesQuotasLeaderboardAction(),
        getSalesPlaybooksAction(),
        getSalesCadencesAction(),
        getContractsCLMAction(),
        getAIUpsellRecommendationsAction(),
      ]);

      setBundles(bunRes);
      setQuotes(qotRes);
      setAccounts(accRes);
      setLeaderboard(quotaRes.leaderboard);
      setForecastSummary(quotaRes.summary);
      setPlaybooks(pbRes);
      setCadences(cadRes);
      setContractsData(clmRes);
      setUpsellRecs(upRes);
    } catch (err) {
      console.error("Error loading commercial data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteAccountName || !quoteEmail) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    const selectedBundle = bundles.find(b => b.id === selectedBundleId) || bundles[0];
    setIsSubmittingQuote(true);

    try {
      const res = await createCPQQuoteAction({
        accountName: quoteAccountName,
        contactEmail: quoteEmail,
        items: [
          {
            bundleId: selectedBundle.id,
            name: selectedBundle.name,
            quantity: Number(quoteQuantity),
            unitPrice: selectedBundle.basePrice,
            discountPercentage: Number(quoteDiscount),
          },
        ],
      });

      if (res.success && res.quote) {
        setQuotes([res.quote, ...quotes]);
        setShowQuoteModal(false);
        setQuoteAccountName('');
        setQuoteEmail('');
        toast.success(`Cotización ${res.quote.quoteNumber} generada exitosamente.`);
      } else {
        toast.error(res.error || "Error al generar cotización.");
      }
    } catch (err) {
      toast.error("Ocurrió un error al procesar la cotización.");
    } finally {
      setIsSubmittingQuote(false);
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
              <Sparkles size={10} className="text-teal-400" /> Tier-1 Enterprise Commercial & Sales ERP
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Centro de Control Comercial, Ventas & CPQ Enterprise
          </h1>
          <p className="ds-subtext mt-1">
            Motor CPQ de Paquetes y Descuentos, Comités de Compra B2B, Cuotas y Pronóstico Ponderado, Playbooks BANT/MEDDIC y Gestión de Contratos CLM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuoteModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Generar Cotización CPQ
          </button>
        </div>
      </div>

      {/* Top Commercial KPIs */}
      {forecastSummary && contractsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ds-card p-5 border-teal-500/30 bg-teal-950/15">
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">Meta Comercial (Q3 2026)</span>
            <p className="text-3xl font-black text-white mt-2 font-mono">${forecastSummary.teamTarget.toLocaleString()} USD</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 font-semibold">${forecastSummary.closedWonTotal.toLocaleString()} USD cerrado ganado</span>
            </div>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Pronóstico Ponderado (Forecast)</span>
            <p className="text-3xl font-black text-teal-400 mt-2 font-mono">${forecastSummary.weightedTotal.toLocaleString()} USD</p>
            <p className="text-xs text-slate-400 mt-1">Cobertura de Pipeline: <strong>{forecastSummary.pipelineCoverageRatio}x</strong></p>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">MRR Recurrente Contratado</span>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">${contractsData.totalMRR.toLocaleString()} USD/mes</p>
            <p className="text-xs text-slate-400 mt-1">ARR Anualizado: <strong>${contractsData.totalARR.toLocaleString()} USD</strong></p>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tasa de Cancelación (Churn Rate)</span>
            <p className="text-3xl font-black text-blue-400 mt-2 font-mono">{contractsData.churnRate}%</p>
            <p className="text-xs text-slate-400 mt-1">Retención de contratos superior al 98%.</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('cpq')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cpq'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-400" /> 1. Motor CPQ & Paquetes
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-400" /> 2. Cuentas B2B & Comité de Compras
        </button>

        <button
          onClick={() => setActiveTab('quotas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'quotas'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Target className="w-4 h-4 text-teal-400" /> 3. Cuotas, Forecast & Leaderboard
        </button>

        <button
          onClick={() => setActiveTab('playbooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'playbooks'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-400" /> 4. Playbooks BANT / MEDDIC
        </button>

        <button
          onClick={() => setActiveTab('cadences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cadences'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Workflow className="w-4 h-4 text-teal-400" /> 5. Secuencias de Prospección
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'contracts'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" /> 6. Contratos CLM & MRR
        </button>

        <button
          onClick={() => setActiveTab('upsell')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upsell'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-teal-400" /> 7. Up-Selling por IA
        </button>
      </div>

      {/* ── TAB 1: CPQ ENGINE & QUOTES ── */}
      {activeTab === 'cpq' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-400" /> Catálogo de Paquetes CPQ (Bundles)
                </h3>
                <p className="text-xs text-slate-400">Estructura paquetes con descuentos por volumen y reglas de compatibilidad.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bundles.map(b => (
                <div key={b.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded bg-teal-950 text-teal-400 text-xs font-mono font-bold border border-teal-800/40">
                      {b.code}
                    </span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      ${b.basePrice.toLocaleString()} {b.currency}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{b.name}</h4>
                  <p className="text-xs text-slate-400">{b.description}</p>

                  <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                    <span className="text-slate-200 font-bold block">Escalas de Descuento:</span>
                    {b.discountTiers.map((d, idx) => (
                      <span key={idx} className="inline-block mr-3 text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {d.minQuantity}+ unid: <strong>{d.discountPercentage}% OFF</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <FileText className="w-5 h-5 text-teal-400" /> Cotizaciones CPQ Emitidas
            </h3>

            <div className="space-y-3">
              {quotes.map(q => (
                <div key={q.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-400">{q.quoteNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        q.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-white font-bold font-sans text-sm mt-1">{q.accountName}</p>
                    <span className="text-slate-500 text-[11px]">Asesor: {q.salesRepName} · Vence: {q.expiresAt.split('T')[0]}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Total Cotizado</span>
                      <span className="text-base font-black text-emerald-400">${q.totalAmount.toLocaleString()} {q.currency}</span>
                    </div>
                    {q.discountRequiresApproval && q.approvalStatus === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800/60">
                        Requiere Aprobación Gerencial
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: B2B ACCOUNTS & BUYING CENTER ── */}
      {activeTab === 'accounts' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" /> Cuentas B2B & Comité de Compras
            </h3>
            <p className="text-xs text-slate-400">Jerarquía de empresas corporativas y mapeo de roles clave en el proceso de decisión.</p>
          </div>

          <div className="space-y-6">
            {accounts.map(acc => (
              <div key={acc.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-400 text-[10px] font-mono font-bold border border-teal-800/40">
                        {acc.tier}
                      </span>
                      <h4 className="text-base font-bold text-white">{acc.companyName}</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-500">NIT: {acc.nit} · {acc.industry} · {acc.employeesCount} empleados</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-slate-500 text-[10px] block">Pipeline Activo</span>
                    <span className="text-base font-black text-teal-400">${acc.openDealsValue.toLocaleString()} USD</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase font-bold">Comité de Compras (Buying Center):</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {acc.buyingCenter.map(member => (
                      <div key={member.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white font-sans">{member.fullName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            member.sentiment === 'POSITIVE' || member.sentiment === 'CHAMPION' ? 'text-emerald-400 bg-emerald-950' : 'text-slate-400 bg-slate-900'
                          }`}>
                            {member.sentiment}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{member.jobTitle}</p>
                        <span className="text-teal-400 text-[10px] block font-bold">Rol: {member.role.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: SALES QUOTAS & LEADERBOARD ── */}
      {activeTab === 'quotas' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Award className="w-5 h-5 text-amber-400" /> Leaderboard & Cumplimiento de Cuotas
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {leaderboard.map(rep => (
                <div key={rep.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      rep.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' :
                      rep.rank === 2 ? 'bg-slate-300 text-slate-950' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      #{rep.rank}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">{rep.userName}</h4>
                      <span className="text-slate-500 text-[11px]">{rep.dealsClosedCount} acuerdos cerrados este trimestre</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-right">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Vendido / Meta</span>
                      <span className="text-emerald-400 font-bold">${rep.closedWonAmount.toLocaleString()} / ${rep.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-28">
                      <div className="flex justify-between text-[11px] font-bold text-teal-400 mb-1">
                        <span>{rep.quotaAttainmentPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-teal-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, rep.quotaAttainmentPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SALES PLAYBOOKS ── */}
      {activeTab === 'playbooks' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-400" /> Playbooks Comerciales & Metodologías BANT / MEDDIC
            </h3>
            <p className="text-xs text-slate-400">Guías estandarizadas para el equipo comercial con preguntas obligatorias y battlecards contra objeciones.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {playbooks.map(pb => (
              <div key={pb.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded bg-teal-950 text-teal-400 text-xs font-mono font-bold border border-teal-800/40">
                    {pb.methodology} · Etapa: {pb.stageTarget}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{pb.title}</h4>
                <p className="text-xs text-slate-400">{pb.description}</p>

                <div className="space-y-2 pt-3 border-t border-slate-800 font-mono text-xs">
                  <span className="text-slate-200 font-bold block">Preguntas Clave de Calificación:</span>
                  <ul className="space-y-1.5 text-slate-400 text-[11px]">
                    {pb.requiredQuestions.map((q, i) => (
                      <li key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
                  <span className="text-amber-400 font-bold block">Battlecards Contra Objeciones:</span>
                  {pb.objectionBattlecards.map((bc, i) => (
                    <div key={i} className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl space-y-1 text-[11px]">
                      <span className="text-white font-bold block">Objeción: "{bc.objection}"</span>
                      <p className="text-slate-300">→ Respuesta: {bc.recommendedResponse}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: SALES CADENCES ── */}
      {activeTab === 'cadences' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Workflow className="w-5 h-5 text-teal-400" /> Secuencias de Prospección & Outreach
            </h3>
            <p className="text-xs text-slate-400">Flujos de contacto multicanal (Email, WhatsApp, Llamadas) programados por días.</p>
          </div>

          <div className="space-y-6">
            {cadences.map(cad => (
              <div key={cad.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-white">{cad.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">Público: {cad.targetAudience}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-500 text-[10px] block">Tasa de Conversión</span>
                    <span className="text-emerald-400 font-bold text-sm">{cad.conversionRate}%</span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {cad.steps.map((st, i) => (
                    <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-4">
                      <span className="px-2 py-1 rounded bg-slate-900 text-teal-400 font-bold text-[10px] shrink-0">
                        Día {st.dayOffset}
                      </span>
                      <div className="space-y-1">
                        <span className="font-bold text-white block">Canal: {st.channel}</span>
                        {st.subject && <p className="text-slate-400 text-[11px]">Asunto: {st.subject}</p>}
                        <p className="text-slate-500 text-[11px]">"{st.content}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: CONTRACTS CLM ── */}
      {activeTab === 'contracts' && contractsData && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Gestión de Contratos & Renovaciones (CLM)
            </h3>
            <p className="text-xs text-slate-400">Supervisa contratos recurrentes, fechas de vencimiento, cláusulas de renovación y MRR.</p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {contractsData.contracts.map(c => (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-400">{c.contractNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-sans">{c.accountName}</h4>
                  <p className="text-slate-400 text-[11px]">{c.serviceTier} · Vigencia: {c.startDate} al {c.endDate}</p>
                </div>

                <div className="flex items-center gap-8 text-right">
                  <div>
                    <span className="text-slate-500 text-[10px] block">MRR Mensual</span>
                    <span className="text-base font-black text-emerald-400">${c.mrrValue.toLocaleString()} {c.currency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Salud de Cuenta</span>
                    <span className="text-teal-400 font-bold">{c.healthScore}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 7: AI UP-SELLING RECOMMENDER ── */}
      {activeTab === 'upsell' && (
        <div className="ds-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" /> Recomendador de Up-Selling & Venta Cruzada con IA
            </h3>
            <p className="text-xs text-slate-400">Oportunidades de expansión de cuenta detectadas automáticamente por análisis de patrones de uso.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upsellRecs.map(rec => (
              <div key={rec.id} className="p-6 rounded-2xl bg-slate-900/60 border border-teal-500/30 bg-teal-950/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded bg-teal-950 text-teal-400 text-xs font-mono font-bold border border-teal-800/40">
                    Confianza IA: {rec.confidenceScore}%
                  </span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    +${rec.estimatedAdditionalMRR} USD/mes
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{rec.accountName}</h4>
                  <span className="text-xs font-mono text-slate-400">Servicio Recomendado: <strong className="text-teal-300">{rec.recommendedBundleName}</strong></span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                  💡 <strong>Justificación:</strong> {rec.rationale}
                </p>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-teal-500/20 font-mono text-[11px] text-teal-300">
                  🗣️ <strong>Pitch Sugerido:</strong> "{rec.suggestedPitch}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE CPQ QUOTE ── */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Layers className="w-4 h-4 text-teal-400" />
                Nueva Cotización Inteligente CPQ
              </h3>
              <button onClick={() => setShowQuoteModal(false)} className="text-slate-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-3">
              <div>
                <label className="text-slate-400 uppercase block">Nombre de la Empresa / Cuenta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TechCorp Global S.A.S."
                  value={quoteAccountName}
                  onChange={(e) => setQuoteAccountName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white mt-1 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase block">Correo del Tomador de Decisión *</label>
                <input
                  type="email"
                  required
                  placeholder="compras@techcorp.com"
                  value={quoteEmail}
                  onChange={(e) => setQuoteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white mt-1 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase block">Paquete de Solución (Bundle)</label>
                <select
                  value={selectedBundleId}
                  onChange={(e) => setSelectedBundleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-teal-400 mt-1 outline-none"
                >
                  {bundles.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (${b.basePrice} USD)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase block">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={quoteQuantity}
                    onChange={(e) => setQuoteQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase block">Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={quoteDiscount}
                    onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white mt-1 outline-none"
                  />
                </div>
              </div>

              {quoteDiscount > 15 && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-400 text-[11px]">
                  ⚠️ <strong>Aviso de Gobernanza:</strong> Descuentos superiores al 15% requerirán aprobación de la Gerencia Comercial antes de enviarse al cliente.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingQuote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Emitir Cotización CPQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
