"use client";

import React from "react";
import { Info } from "lucide-react";

export function TermsAndConditions() {
  return (
    <div className="mt-12 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 text-zinc-400 text-sm">
      <div className="flex items-center gap-3 mb-4 text-emerald-500">
        <Info className="w-5 h-5 flex-shrink-0" />
        <h3 className="font-medium text-zinc-200">Términos y Condiciones Generales</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <p>
          <strong className="text-zinc-300">Validez y Vigencia:</strong> Las tarifas mostradas son netas y exclusivas para el periodo en curso. Sujetas a cambios con previo aviso de 30 días.
        </p>
        <p>
          <strong className="text-zinc-300">Servicios Express:</strong> Todo requerimiento con entrega menor a 48h hábiles aplica un recargo automático indicado en la columna de Precio Urgente.
        </p>
        <p>
          <strong className="text-zinc-300">Forma de Pago:</strong> Para servicios individuales se requiere el pago 100% anticipado. Para paquetes mensuales (Fee) se factura en los primeros 5 días del mes.
        </p>
        <p>
          <strong className="text-zinc-300">Cancelaciones:</strong> Una vez iniciado el trabajo o agendada la sesión (ej. Fotografía), las cancelaciones con menos de 24h retienen un 50% de penalidad.
        </p>
      </div>
      
      <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs flex justify-between items-center opacity-70">
        <span>Documento confidencial. Prohibida su distribución.</span>
        <span>Última actualización: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}
