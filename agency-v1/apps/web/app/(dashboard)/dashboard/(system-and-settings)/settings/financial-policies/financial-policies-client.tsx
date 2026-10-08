'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  RefreshCw,
  Sliders,
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
  ArrowRight
} from 'lucide-react';

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
        setSuccessMessage('Políticas financieras guardadas y sincronizadas en toda la plataforma.');
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
    <div className="space-y-6">
      {/* ── Cabecera Quantum Enterprise ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border border-border shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
              <Scale size={13} />
              <span>Gobernanza Corporativa & Control Financiero</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              Políticas de Aprobación & Umbrales de Compra
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Configuración centralizada y exclusiva de gobernanza para la organización. Los paneles operativos
              heredan estas reglas de forma obligatoria e inmutable.
            </p>
          </div>

          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card text-foreground text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Recargar
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Formulario de Gobernanza ─────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Pilar 1: Umbral de Aprobación Financiera */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                1. Umbral Máximo de Aprobación Automática
              </h2>
              <p className="text-xs text-muted-foreground">
                Toda orden de compra que supere este monto pasará forzosamente a revisión y visto bueno de Gerencia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Monto Límite / Umbral de Aprobación
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={policies.approvalThreshold}
                  onChange={(e) => setPolicies({ ...policies, approvalThreshold: Number(e.target.value) })}
                  className="w-full pl-8 pr-16 py-2.5 text-sm rounded-xl bg-muted/40 border border-border text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-teal-400">
                  {policies.currency}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Equivalente a: ${(policies.approvalThreshold || 0).toLocaleString('es-CO')} {policies.currency}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Auto-Aprobación bajo el umbral
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Permite enviar al proveedor de inmediato si el monto no supera el límite.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.autoApproveBelowThreshold}
                  onChange={(e) => setPolicies({ ...policies, autoApproveBelowThreshold: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Visto bueno de Líder de Área bajo el umbral
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Exige aprobación de jefe de compras antes de transmitir la orden.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.requireDepartmentManagerBelowThreshold}
                  onChange={(e) =>
                    setPolicies({ ...policies, requireDepartmentManagerBelowThreshold: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pilar 2: Cumplimiento de Calidad y Bloqueos de Seguridad */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                2. Reglas de Homologación de Proveedores & Calidad
              </h2>
              <p className="text-xs text-muted-foreground">
                Políticas de bloqueo estricto para mitigar riesgos legales, financieros o de insalubridad.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Bloqueo estricto de Proveedores No Conformes
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Impide emitir órdenes a proveedores con RUT vencido, suspendidos o bloqueados.
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.preventOrdersWithBlockedSuppliers}
                onChange={(e) => setPolicies({ ...policies, preventOrdersWithBlockedSuppliers: e.target.checked })}
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Auditoría en muelle para Materias Primas
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Exige certificado de calidad y lote obligatorio antes de permitir el ingreso a kárdex.
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.requireQualityAuditForRawMaterials}
                onChange={(e) =>
                  setPolicies({ ...policies, requireQualityAuditForRawMaterials: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Pilar 3: Parámetros Logísticos y Conciliación Facturación */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                3. Directrices Logísticas, Incoterms & Tolerancia
              </h2>
              <p className="text-xs text-muted-foreground">
                Estándares predeterminados para nuevas negociaciones y tolerancia de precios.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Incoterm Predeterminado</label>
              <select
                value={policies.defaultIncoterm}
                onChange={(e) => setPolicies({ ...policies, defaultIncoterm: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
              >
                {ALL_INCOTERMS.map((inc) => (
                  <option key={inc.code} value={inc.code}>
                    {inc.code} - {inc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Días de Gracia en Tiempo de Entrega (Lead Time)
              </label>
              <input
                type="number"
                min="0"
                value={policies.leadTimeGracePeriodDays}
                onChange={(e) => setPolicies({ ...policies, leadTimeGracePeriodDays: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Tolerancia Máxima Variación de Precio (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={policies.maxAllowedPriceVariancePct}
                onChange={(e) => setPolicies({ ...policies, maxAllowedPriceVariancePct: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border mt-3">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Conciliación 3-Way Match Obligatoria (OC + Recepción + Factura)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Impide la radicación contable de facturas de proveedores sin un acta de recepción en muelle completada.
              </span>
            </div>
            <input
              type="checkbox"
              checked={policies.requireMatchingReceiptBeforePayment}
              onChange={(e) =>
                setPolicies({ ...policies, requireMatchingReceiptBeforePayment: e.target.checked })
              }
              className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando Políticas...' : 'GUARDAR POLÍTICAS DE GOBERNANZA'}
          </button>
        </div>
      </form>
    </div>
  );
}
