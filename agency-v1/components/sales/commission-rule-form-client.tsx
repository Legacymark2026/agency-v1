"use client";
import { useState, useTransition } from "react";
import { createCommissionRule } from "@/actions/crm-commissions";
import { toast } from "sonner";
import { DollarSign, X, Plus, Info } from "lucide-react";

type User = { id: string; name: string | null; email: string | null };

export function CommissionRuleFormClient({
  companyId,
  teamUsers,
}: {
  companyId: string;
  teamUsers: User[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    userId: "",
    rate: "",
    minDealValue: "",
    capAmount: "",
    label: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(form.rate) / 100; // convert % to decimal
    if (!rate || rate <= 0 || rate > 1) {
      toast.error("La tasa debe estar entre 0.1% y 100%");
      return;
    }

    startTransition(async () => {
      const res = await createCommissionRule({
        companyId,
        userId: form.userId || null,
        rate,
        minDealValue: parseFloat(form.minDealValue) || 0,
        capAmount: form.capAmount ? parseFloat(form.capAmount) : null,
        label: form.label || undefined,
      });

      if (res.success) {
        toast.success("✅ Regla de comisión creada");
        setOpen(false);
        setForm({ userId: "", rate: "", minDealValue: "", capAmount: "", label: "" });
      } else {
        toast.error("Error al crear la regla");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-teal-300 transition-all hover:scale-105"
        style={{
          background: "rgba(13,148,136,0.1)",
          border: "1px solid rgba(13,148,136,0.3)",
        }}
      >
        <Plus size={13} /> Nueva Regla
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative z-10 rounded-2xl p-6 w-[480px]"
            style={{
              background: "rgba(10,15,30,0.98)",
              border: "1px solid rgba(30,41,59,0.9)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)" }}>
                  <DollarSign size={15} className="text-teal-400" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-black text-slate-200 uppercase tracking-widest">Nueva Regla de Comisión</p>
                  <p className="font-mono text-[9px] text-slate-600">Commission Engine</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info banner */}
              <div className="flex gap-2 p-3 rounded-lg" style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)" }}>
                <Info size={13} className="text-sky-400 mt-0.5 flex-shrink-0" />
                <p className="font-mono text-[9px] text-sky-400/80 leading-relaxed">
                  Si dejas el vendedor vacío, la regla aplica globalmente a todo el equipo. Las reglas específicas por usuario tienen prioridad.
                </p>
              </div>

              {/* Vendedor */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">
                  Vendedor <span className="text-slate-700">(vacío = regla global)</span>
                </label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">🌐 Regla Global (todo el equipo)</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tasa */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">
                  Tasa de Comisión (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    required
                    value={form.rate}
                    onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                    placeholder="5"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">%</span>
                </div>
                {form.rate && (
                  <p className="font-mono text-[9px] text-teal-500 mt-1">
                    = ${(parseFloat(form.rate || "0") / 100 * 10000).toFixed(0)} por cada $10,000 en ventas
                  </p>
                )}
              </div>

              {/* Min Deal Value */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">
                  Valor Mínimo de Deal ($USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.minDealValue}
                  onChange={(e) => setForm((f) => ({ ...f, minDealValue: e.target.value }))}
                  placeholder="0 (aplica a todos)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Cap optional */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">
                  Límite Máximo de Comisión ($USD) <span className="text-slate-700">— opcional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.capAmount}
                  onChange={(e) => setForm((f) => ({ ...f, capAmount: e.target.value }))}
                  placeholder="Sin límite"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Label */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Etiqueta</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder='Ej: "Acelerador Q2" o "Regla Base"'
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #0d9488, #0ea5e9)", boxShadow: "0 0 20px rgba(13,148,136,0.3)" }}
              >
                {isPending ? "Creando regla..." : "✓ Crear Regla de Comisión"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
