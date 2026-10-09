'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Scale,
  Lock,
  Layers,
  FileCheck2,
  HelpCircle,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';

// Lista Oficial de Incoterms 2020
export const ALL_INCOTERMS = [
  { code: 'EXW', name: 'Ex Works' },
  { code: 'FCA', name: 'Free Carrier' },
  { code: 'CPT', name: 'Carriage Paid To' },
  { code: 'CIP', name: 'Carriage and Insurance Paid To' },
  { code: 'DAP', name: 'Delivered at Place' },
  { code: 'DPU', name: 'Delivered at Place Unloaded' },
  { code: 'DDP', name: 'Delivered Duty Paid' },
  { code: 'FAS', name: 'Free Alongside Ship' },
  { code: 'FOB', name: 'Free On Board' },
  { code: 'CFR', name: 'Cost and Freight' },
  { code: 'CIF', name: 'Cost, Insurance and Freight' }
];

export function FinancialPoliciesClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [policies, setPolicies] = useState({
    approvalThreshold: 10000000,
    currency: 'COP',
    requireQualityAuditForRawMaterials: true,
    autoApproveBelowThreshold: true,
    requireDepartmentManagerBelowThreshold: false,
    preventOrdersWithBlockedSuppliers: true,
    leadTimeGracePeriodDays: 2,
    defaultIncoterm: 'DAP',
    requireMatchingReceiptBeforePayment: true,
    maxAllowedPriceVariancePct: 5.0,
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/governance/financial-policies');
      const data = await res.json();
      if (data.success && data.policies) {
        setPolicies(data.policies);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage(null);
      const res = await fetch('/api/governance/financial-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Políticas de aprobación y umbrales guardados y sincronizados en toda la plataforma.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (err: any) {
      alert('Error en conexión: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

      {/* ── Header Spotlight (Mismo estilo exacto del Dashboard Principal) ── */}
      <InteractiveSpotlight
        className="relative z-10 ds-card group"
        style={{ padding: '2rem 2.5rem' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.07),transparent_70%)] pointer-events-none" />
        <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">
          [SYS_GOV · POL]
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="mb-4">
              <span className="ds-badge ds-badge-teal">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                </span>
                <Sparkles size={8} /> Gobernanza Institucional · Control Activo
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white">
              Políticas de Aprobación &{" "}
              <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                Umbrales de Compra
              </span>
            </h1>
            <p className="ds-subtext mt-2">
              Configuración centralizada y exclusiva de gobernanza para la organización. Los módulos de compras e inventario heredan estas reglas de forma obligatoria.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchPolicies}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin text-teal-400' : ''} />
              Recargar
            </button>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs text-teal-400 uppercase tracking-widest"
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}
            >
              <ShieldCheck size={12} className="text-teal-500" />
              Gobernanza & Compliance
            </div>
          </div>
        </div>
      </InteractiveSpotlight>

      {successMessage && (
        <div className="relative z-10 p-4 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Formulario de Gobernanza con Tarjetas ds-card ───────────────────── */}
      <form onSubmit={handleSave} className="relative z-10 space-y-6">
        {/* Pilar 1: Umbral de Aprobación Financiera */}
        <div className="ds-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="ds-icon-box w-9 h-9 bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded">
                <DollarSign size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  1. Umbral Máximo de Aprobación Automática
                </h2>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  Toda orden de compra que supere este límite requerirá aprobación forzosa por Gerencia/CFO antes de ser emitida al proveedor.
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-amber-400/80 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Control Presupuestal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                Monto Límite / Umbral de Aprobación
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={policies.approvalThreshold}
                  onChange={(e) => setPolicies({ ...policies, approvalThreshold: Number(e.target.value) })}
                  className="w-full pl-8 pr-16 py-3 text-sm rounded bg-slate-950/80 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-black text-teal-400">
                  {policies.currency}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-2">
                Equivalente actual: <span className="text-teal-300 font-bold">${(policies.approvalThreshold || 0).toLocaleString('es-CO')}</span> {policies.currency}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Auto-Aprobación bajo el umbral
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Permite enviar al proveedor de inmediato si el monto no supera el límite.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.autoApproveBelowThreshold}
                  onChange={(e) => setPolicies({ ...policies, autoApproveBelowThreshold: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-teal-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Visto bueno de Líder de Área bajo el umbral
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Exige aprobación departamental antes de transmitir la orden de compra.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.requireDepartmentManagerBelowThreshold}
                  onChange={(e) =>
                    setPolicies({ ...policies, requireDepartmentManagerBelowThreshold: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-teal-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Pilar 2: Cumplimiento de Calidad y Homologación */}
        <div className="ds-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="ds-icon-box w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center rounded">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  2. Reglas de Homologación de Proveedores & Calidad
                </h2>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  Políticas de bloqueo estricto para mitigar riesgos legales, financieros o de insalubridad.
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-indigo-400/80 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              SRM Compliance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">
                  Bloqueo estricto de Proveedores No Conformes
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Impide emitir órdenes a proveedores con RUT vencido, suspendidos o bloqueados.
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.preventOrdersWithBlockedSuppliers}
                onChange={(e) => setPolicies({ ...policies, preventOrdersWithBlockedSuppliers: e.target.checked })}
                className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-teal-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">
                  Auditoría en muelle para Materias Primas
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Exige certificado de calidad y lote obligatorio antes de permitir el ingreso a kárdex.
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.requireQualityAuditForRawMaterials}
                onChange={(e) =>
                  setPolicies({ ...policies, requireQualityAuditForRawMaterials: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-teal-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Pilar 3: Parámetros Logísticos e Incoterms */}
        <div className="ds-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="ds-icon-box w-9 h-9 bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center rounded">
                <Truck size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  3. Directrices Logísticas, Incoterms & Tolerancia
                </h2>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  Estándares predeterminados para nuevas negociaciones y tolerancia de precios.
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-widest px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              Operaciones & Kárdex
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">Incoterm Predeterminado</label>
              <select
                value={policies.defaultIncoterm}
                onChange={(e) => setPolicies({ ...policies, defaultIncoterm: e.target.value })}
                className="w-full text-xs px-3 py-3 rounded bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-teal-500/60"
              >
                {ALL_INCOTERMS.map((inc) => (
                  <option key={inc.code} value={inc.code} className="bg-slate-900 text-white">
                    {inc.code} - {inc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                Días de Gracia en Entrega (Lead Time)
              </label>
              <input
                type="number"
                min="0"
                value={policies.leadTimeGracePeriodDays}
                onChange={(e) => setPolicies({ ...policies, leadTimeGracePeriodDays: Number(e.target.value) })}
                className="w-full text-xs px-3 py-3 rounded bg-slate-950/80 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                Tolerancia Máx. Variación Precio (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={policies.maxAllowedPriceVariancePct}
                onChange={(e) => setPolicies({ ...policies, maxAllowedPriceVariancePct: Number(e.target.value) })}
                className="w-full text-xs px-3 py-3 rounded bg-slate-950/80 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500/60"
              />
            </div>
          </div>

          <label className="flex items-center justify-between p-3.5 rounded bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer mt-3">
            <div>
              <span className="text-xs font-bold text-white block">
                Conciliación 3-Way Match Obligatoria (OC + Recepción + Factura)
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Impide la radicación contable de facturas de proveedores sin un acta de recepción en muelle completada.
              </span>
            </div>
            <input
              type="checkbox"
              checked={policies.requireMatchingReceiptBeforePayment}
              onChange={(e) =>
                setPolicies({ ...policies, requireMatchingReceiptBeforePayment: e.target.checked })
              }
              className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-teal-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Botón de Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 rounded font-mono font-black text-xs text-slate-950 uppercase tracking-widest bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-[0_0_25px_-5px_rgba(20,184,166,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={14} strokeWidth={2.5} />
            {saving ? 'Guardando Políticas...' : 'GUARDAR POLÍTICAS DE GOBERNANZA'}
          </button>
        </div>
      </form>
    </div>
  );
}
