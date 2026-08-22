"use client";

import React, { useState } from "react";

export default function InboxDashboardPage() {
  const [activeChannel, setActiveChannel] = useState<"ALL" | "WHATSAPP" | "EMAIL" | "WEBCHAT">("ALL");
  const [selectedThread, setSelectedThread] = useState<any>({
    id: "th_01",
    client: "Carlos Mendoza (Agencia Bogotá)",
    channel: "WHATSAPP",
    sentiment: "POSITIVE",
    lastMessage: "Hola, quisiera solicitar la factura de la renovación de la licencia Pro.",
    time: "10:14 AM",
  });
  const [replyText, setReplyText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");

  const handleGenerateAiReply = () => {
    setAiSuggestion(
      "Hola Carlos, con gusto. Tu factura electrónica fue enviada a tu correo registrado y está disponible en la sección /dashboard/invoicing."
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
          Bandeja de Entrada Multicanal Unificada (Inbox AI)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Centraliza conversaciones de WhatsApp, Correo, Chat Web e Instagram con sugerencias de respuesta IA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thread List */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200">Conversaciones Activas</h2>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
              4 Nuevas
            </span>
          </div>

          <div className="space-y-2">
            {[
              { id: "th_01", client: "Carlos Mendoza", channel: "WHATSAPP", time: "10:14 AM", text: "Solicitar factura de renovación..." },
              { id: "th_02", client: "Inversiones Medellín", channel: "EMAIL", time: "09:45 AM", text: "Propuesta comercial para 50 agentes..." },
              { id: "th_03", client: "Laura Gómez", channel: "WEBCHAT", time: "Ayer", text: "¿Tienen integración con Wompi?" },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedThread(t)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedThread.id === t.id
                    ? "bg-slate-800/90 border-cyan-500/50"
                    : "bg-slate-950/60 border-slate-800 hover:bg-slate-950"
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{t.client}</span>
                  <span className="text-[10px] text-slate-500">{t.time}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 truncate">{t.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation View & AI Assistant */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedThread.client}</h3>
                <span className="text-xs text-cyan-400 font-semibold">{selectedThread.channel}</span>
              </div>
              <button
                onClick={handleGenerateAiReply}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                ✨ Sugerir Respuesta con IA
              </button>
            </div>

            {/* Chat Bubble */}
            <div className="py-6 space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-md text-xs text-slate-200">
                {selectedThread.lastMessage}
              </div>

              {aiSuggestion && (
                <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-2xl max-w-md text-xs text-cyan-200 space-y-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Sugerencia IA Smart Reply:</span>
                  <p>{aiSuggestion}</p>
                  <button
                    onClick={() => {
                      setReplyText(aiSuggestion);
                      setAiSuggestion("");
                    }}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] rounded-lg transition-all"
                  >
                    Usar esta respuesta
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reply Box */}
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Escribe tu mensaje o usa la sugerencia de la IA..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                alert("Mensaje enviado exitosamente.");
                setReplyText("");
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              🚀 Enviar Mensaje Multicanal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
