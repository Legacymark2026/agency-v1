import React, { useState, useEffect } from "react";
import { X, Calculator, Plus } from "lucide-react";
import { ServicePrice } from "@/types/pricing";

interface PricingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Omit<ServicePrice, "id" | "orderIndex">) => void;
  serviceConfig: ServicePrice | null;
}

const CATEGORIAS = ["ASESORÍAS", "CREACIÓN DE CONTENIDO/AUDIOVISUAL", "AUDIOVISUAL", "DESARROLLO"];

export function PricingFormModal({
  isOpen,
  onClose,
  onSubmit,
  serviceConfig,
}: PricingFormModalProps) {
  const [formData, setFormData] = useState({
    codigo_id: "",
    nombre_servicio: "",
    categoria: "ASESORÍAS",
    tipo_formato: "",
    tiempo_estimado: "",
    herramientas: "",
    descripcion: "",
    precio_base: 0,
    iva_porcentaje: 19.0,
    retefuente_porc: 11.0,
    reteiva_porc: 2.85,
    ica_porc: 0.6,
    precio_urgente: 0,
    isExpress: false,
    estado: "activo",
  });

  useEffect(() => {
    if (serviceConfig && isOpen) {
      setFormData({
        codigo_id: serviceConfig.codigo_id || "",
        nombre_servicio: serviceConfig.nombre_servicio,
        categoria: serviceConfig.categoria,
        tipo_formato: serviceConfig.tipo_formato || "",
        tiempo_estimado: serviceConfig.tiempo_estimado || "",
        herramientas: serviceConfig.herramientas || "",
        descripcion: serviceConfig.descripcion,
        precio_base: serviceConfig.precio_base,
        iva_porcentaje: serviceConfig.iva_porcentaje ?? 19.0,
        retefuente_porc: serviceConfig.retefuente_porc ?? 11.0,
        reteiva_porc: serviceConfig.reteiva_porc ?? 2.85,
        ica_porc: serviceConfig.ica_porc ?? 0.6,
        precio_urgente: serviceConfig.precio_urgente || 0,
        isExpress: serviceConfig.isExpress,
        estado: serviceConfig.estado,
      });
    } else if (isOpen) {
      setFormData({
        codigo_id: "",
        nombre_servicio: "",
        categoria: "ASESORÍAS",
        tipo_formato: "",
        tiempo_estimado: "",
        herramientas: "",
        descripcion: "",
        precio_base: 0,
        iva_porcentaje: 19.0,
        retefuente_porc: 11.0,
        reteiva_porc: 2.85,
        ica_porc: 0.6,
        precio_urgente: 0,
        isExpress: false,
        estado: "activo",
      });
    }
  }, [serviceConfig, isOpen]);

  if (!isOpen) return null;

  const base = formData.precio_base || 0;
  const iva = base * (formData.iva_porcentaje / 100);
  const subtotal = base + iva;
  const reteiva = iva * (formData.reteiva_porc / 100);
  const retefuente = base * (formData.retefuente_porc / 100);
  const ica = base * (formData.ica_porc / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      precio_urgente: formData.isExpress ? formData.precio_urgente : null,
    } as Omit<ServicePrice, "id" | "orderIndex">);
    onClose();
  };

  return (
    <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div suppressHydrationWarning className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto hide-scrollbar">
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
               {serviceConfig ? "Editar Servicio" : "Nuevo Servicio / Costo"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1.5 uppercase tracking-wide">Código ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AC-001"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                    value={formData.codigo_id}
                    onChange={(e) => setFormData({ ...formData, codigo_id: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Categoría</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37]"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Servicio Específico</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100"
                    value={formData.nombre_servicio}
                    onChange={(e) => setFormData({ ...formData, nombre_servicio: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Tipo de Formato</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100"
                    value={formData.tipo_formato}
                    onChange={(e) => setFormData({ ...formData, tipo_formato: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Tiempo Estimado</label>
                  <input
                    type="text"
                    placeholder="Ej. 2 horas"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100"
                    value={formData.tiempo_estimado}
                    onChange={(e) => setFormData({ ...formData, tiempo_estimado: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Herramientas</label>
                  <input
                    type="text"
                    placeholder="Figma, Adobe, Workspace"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100"
                    value={formData.herramientas}
                    onChange={(e) => setFormData({ ...formData, herramientas: e.target.value })}
                  />
               </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Descripción</label>
              <textarea
                required
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 resize-none"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="bg-[#0b3936]/10 border border-emerald-900/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                   <Calculator className="w-4 h-4 text-emerald-500" />
                   <h3 className="text-sm font-semibold text-emerald-400">Modelo Financiero Tributario</h3>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-amber-200 mb-1.5 uppercase tracking-wide">Precio CND Sin IVA (COP / USD)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            className="w-full bg-black border border-amber-900/50 rounded-xl px-4 py-2.5 text-lg font-mono text-zinc-100 font-semibold"
                            value={formData.precio_base || ""}
                            onChange={(e) => setFormData({ ...formData, precio_base: parseFloat(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-black/40 p-3 rounded-lg border border-black/50">
                        <div>
                            <span className="block text-zinc-500 mb-1">IVA {formData.iva_porcentaje}%</span>
                            <span className="text-zinc-200 font-mono">${Math.round(iva).toLocaleString('en-US')}</span>
                        </div>
                        <div>
                            <span className="block text-emerald-500 mb-1">+ Subtotal</span>
                            <span className="text-emerald-400 font-mono font-bold">${Math.round(subtotal).toLocaleString('en-US')}</span>
                        </div>
                        <div>
                            <span className="block text-red-400/70 mb-1">- ReteIVA {formData.reteiva_porc}%</span>
                            <span className="text-red-400/80 font-mono">${Math.round(reteiva).toLocaleString('en-US')}</span>
                        </div>
                        <div>
                            <span className="block text-red-400/70 mb-1">- ReteF {formData.retefuente_porc}%</span>
                            <span className="text-red-400/80 font-mono">${Math.round(retefuente).toLocaleString('en-US')}</span>
                        </div>
                         <div>
                            <span className="block text-red-400/70 mb-1">- ICA {formData.ica_porc}%</span>
                            <span className="text-red-400/80 font-mono">${Math.round(ica).toLocaleString('en-US')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <div>
                <div className="text-sm font-medium text-zinc-100 mb-1">Servicio Express</div>
                <div className="text-xs text-zinc-500 max-w-[200px]">Ofrecer entrega acelerada opcional con recargo.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isExpress}
                  onChange={(e) => setFormData({ ...formData, isExpress: e.target.checked })}
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {formData.isExpress && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Recargo Urgente (+ Valor Final)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="200"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-100"
                    value={formData.precio_urgente}
                    onChange={(e) => setFormData({ ...formData, precio_urgente: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5"
              >
                {serviceConfig ? "Guardar Cambios" : "Crear Servicio"}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
