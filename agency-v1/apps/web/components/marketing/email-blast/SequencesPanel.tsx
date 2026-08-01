'use client';

import { useState } from 'react';
import { GitFork, Plus, Play, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function SequencesPanel() {
  const [sequences, setSequences] = useState([
    {
      id: 'seq-1',
      name: 'Secuencia de Bienvenida Onboarding',
      trigger: 'Nuevo usuario registrado',
      status: 'ACTIVE',
      subscribers: 142,
      steps: [
        { day: 'Día 1', title: 'Correo de bienvenida y credenciales' },
        { day: 'Día 3', title: 'Caso de éxito e inicio rápido' },
        { day: 'Día 7', title: 'Oferta especial con asesor dedicado' }
      ]
    },
    {
      id: 'seq-2',
      name: 'Reactivación de Clientes Inactivos',
      trigger: 'Sin interacción en 60 días',
      status: 'PAUSED',
      subscribers: 89,
      steps: [
        { day: 'Día 1', title: 'Te echamos de menos + novedad de plataforma' },
        { day: 'Día 5', title: 'Cupón exclusivo 20% descuento' }
      ]
    }
  ]);

  const handleCreate = () => {
    toast.success('Nueva secuencia automatizada lista para configurar');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-teal-400" />
            Automatizaciones & Campañas de Goteo (Drip Sequences)
          </h2>
          <p className="text-sm text-slate-400">Diseña flujos de trabajo automatizados para nutrir y convertir tus contactos sin intervención manual</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Secuencia Drip</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sequences.map((seq) => (
          <div key={seq.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${seq.status === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {seq.status === 'ACTIVE' ? '🟢 Activa' : '⏸️ Pausada'}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{seq.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Disparador: <strong className="text-slate-200">{seq.trigger}</strong></p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Contactos en flujo</span>
                <span className="text-lg font-black text-teal-400">{seq.subscribers}</span>
              </div>
            </div>

            {/* Steps Timeline preview */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pasos de la Secuencia ({seq.steps.length})</span>
              {seq.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-bold font-mono">{step.day}</span>
                  <span className="text-slate-300 font-medium flex-1">{step.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
