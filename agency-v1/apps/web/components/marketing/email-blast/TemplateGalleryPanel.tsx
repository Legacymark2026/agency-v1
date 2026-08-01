'use client';

import { useState } from 'react';
import { Layout, Sparkles, Copy, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function TemplateGalleryPanel() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const templates = [
    {
      id: 'tpl-1',
      name: 'Bienvenida Comercial B2B',
      category: 'Onboarding',
      emoji: '💼',
      description: 'Encabezado con gradiente oscuro, logotipo central, viñetas de propuesta de valor y botón de llamada a la acción.',
      tags: ['B2B', 'Dark Mode', 'Responsive']
    },
    {
      id: 'tpl-2',
      name: 'Oferta Promocional Flash Sale',
      category: 'Ventas',
      emoji: '🔥',
      description: 'Diseñado para generar urgencia con temporizador, cupón destacado y cuadrícula de productos recomendados.',
      tags: ['Descuento', 'E-commerce', 'Urgencia']
    },
    {
      id: 'tpl-3',
      name: 'Boletín Semanal Newsletter',
      category: 'Noticias',
      emoji: '📰',
      description: 'Estructura editorial limpia en tres secciones: noticia principal, enlaces destacados y tarjeta de comunidad.',
      tags: ['Editorial', 'Newsletter', 'Contenido']
    },
    {
      id: 'tpl-4',
      name: 'Reactivación de Clientes Inactivos',
      category: 'Retención',
      emoji: '🎁',
      description: 'Mensaje de propuesta exclusiva "Te extrañamos" enfocado en recuperar clientes que no compran hace 60 días.',
      tags: ['Win-back', 'Retención', 'Cupón']
    }
  ];

  const handleUse = (name: string) => {
    toast.success(`Plantilla "${name}" cargada en el editor visual`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-teal-400" />
            Galería de Plantillas Profesionales
          </h2>
          <p className="text-sm text-slate-400">Selecciona entre plantillas responsivas listas para usar y optimizadas para alta conversión</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all shadow-md space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                {tpl.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">{tpl.category}</span>
                  <div className="flex gap-1">
                    {tpl.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="text-base font-black text-white mt-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tpl.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => handleUse(tpl.name)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Usar Plantilla</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
