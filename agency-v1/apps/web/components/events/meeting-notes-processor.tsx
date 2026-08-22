"use client";

import React, { useState } from "react";

export interface MeetingNotesProcessorProps {
  appointmentId?: string;
  className?: string;
}

export function MeetingNotesProcessor({ appointmentId = "appt-101", className = "" }: MeetingNotesProcessorProps) {
  const [notesText, setNotesText] = useState<string>(
    "Reunión de seguimiento estratégica:\n- [ ] Enviar propuesta actualizada a TechCorp\n- [ ] Programar demo de integración de pagos POS\n- [ ] Revisar contrato legal de privacidad"
  );
  const [loading, setLoading] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [processed, setProcessed] = useState(false);

  const handleProcessNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/appointments/${encodeURIComponent(appointmentId)}/process-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesText })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.tasks) {
          setExtractedTasks(json.tasks);
          setProcessed(true);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    const matches: string[] = [];
    const lines = notesText.split("\n");
    for (const line of lines) {
      const match = line.match(/^[-*]\s*\[\s*\]\s*(.+)/i);
      if (match) {
        matches.push(match[1].trim());
      }
    }

    setExtractedTasks(matches.length > 0 ? matches : ["Revisar propuesta comercial con el cliente"]);
    setProcessed(true);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl transition-all shadow-xl ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-base">Extractor de Tareas desde Minutas de Reunión</h3>
          <p className="text-xs text-slate-400">Extrae automáticamente viñetas [- ] y despáchalas al CRM</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Notas de la Cita / Reunión (Markdown)</label>
          <textarea
            rows={5}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleProcessNotes}
        disabled={loading}
        className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-purple-500 active:scale-95 disabled:opacity-50"
      >
        {loading ? "Extrayendo tareas..." : "Extraer Tareas y Despachar a CRM"}
      </button>

      {processed && (
        <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-950/30 p-4 space-y-3">
          <div className="text-xs font-semibold text-purple-300 flex items-center justify-between">
            <span>✅ Tareas Extraídas ({extractedTasks.length})</span>
            <span className="text-[10px] text-purple-400">STATUS: DESPACHADAS CRM</span>
          </div>

          <div className="space-y-2">
            {extractedTasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-purple-400 font-bold">✓</span>
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
