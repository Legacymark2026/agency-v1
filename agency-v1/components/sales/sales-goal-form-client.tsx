"use client";
import { useState, useTransition } from "react";
import { upsertSalesGoal } from "@/actions/crm-goals";
import { toast } from "sonner";
import { Target, X, Plus } from "lucide-react";

type User = { id: string; name: string | null; email: string | null };

export function SalesGoalFormClient({
  companyId,
  period,
  teamUsers,
}: {
  companyId: string;
  period: string;
  teamUsers: User[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ userId: "", targetAmount: "", label: "", level: "INDIVIDUAL" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await upsertSalesGoal({
        companyId,
        period,
        userId: form.userId || null,
        targetAmount: parseFloat(form.targetAmount) || 0,
        label: form.label || `Meta ${period}`,
        currency: "USD",
      });
      if (res.success) {
        toast.success("✅ Meta registrada exitosamente");
        setOpen(false);
        setForm({ userId: "", targetAmount: "", label: "", level: "INDIVIDUAL" });
      } else {
        toast.error("Error al guardar la meta");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-slate-900 transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, #0d9488, #0ea5e9)", boxShadow: "0 0 20px rgba(13,148,136,0.3)" }}
      >
        <Plus size={13} /> Nueva Meta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative z-10 rounded-2xl p-6 w-[460px]"
            style={{
              background: "rgba(10,15,30,0.98)",
              border: "1px solid rgba(30,41,59,0.9)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)" }}>
                  <Target size={15} className="text-teal-400" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-black text-slate-200 uppercase tracking-widest">Nueva Meta</p>
                  <p className="font-mono text-[9px] text-slate-600">{period}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nivel */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Nivel de Meta</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="AGENCY">🏢 Agencia (Global)</option>
                  <option value="DEPARTMENT">🏬 Departamento</option>
                  <option value="TEAM">👥 Equipo</option>
                  <option value="INDIVIDUAL">👤 Individual</option>
                </select>
              </div>

              {/* Vendedor */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">
                  Vendedor <span className="text-slate-700">(vacío = meta global)</span>
                </label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">📊 Meta Global de la Empresa</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Target ($USD)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="50000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Etiqueta */}
              <div>
                <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Etiqueta</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder={`Q2 ${new Date().getFullYear()}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #0d9488, #0ea5e9)", boxShadow: "0 0 20px rgba(13,148,136,0.3)" }}
              >
                {isPending ? "Guardando..." : "✓ Registrar Meta"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
