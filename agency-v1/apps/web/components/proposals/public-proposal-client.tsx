"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  CheckCircle2,
  Lock,
  Building2,
  TerminalSquare,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BlogContentViewer } from "@/components/blog/blog-content-viewer";

interface ProposalData {
  id: string;
  title: string;
  token: string;
  status: string;
  value: number;
  currency: string;
  contactName?: string;
  contactEmail?: string;
  createdAt: string;
  company?: {
    name: string;
    logoUrl?: string;
  };
  content?: string;
  items?: Array<{
    id: string;
    title: string;
    description?: string;
    quantity: number;
    price: number;
  }>;
}

interface PublicProposalClientProps {
  proposal: ProposalData;
  onViewTracked: () => void;
}

export function PublicProposalClient({
  proposal,
  onViewTracked,
}: PublicProposalClientProps) {
  const [showSignature, setShowSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProposal, setCurrentProposal] = useState(proposal);
  const sigCanvas = useRef<any>(null);

  const isSigned = currentProposal.status === "SIGNED";

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleAccept = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert("Por favor brinde su firma digital para aceptar los términos.");
      return;
    }

    const signatureData = sigCanvas.current
      .getTrimmedCanvas()
      .toDataURL("image/png");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/public/proposals/${proposal.token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signatureData }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentProposal(data.proposal);
        setShowSignature(false);
      } else {
        alert(data.error || "Ocurrió un error al procesar la firma");
      }
    } catch (e) {
      alert("Error de conexión al servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 overflow-x-hidden relative pb-32">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-teal-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        {/* Header Branding */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-5">
            {currentProposal.company?.logoUrl ? (
              <div className="h-16 w-16 bg-white rounded-xl p-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <img
                  src={currentProposal.company.logoUrl}
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center border border-slate-700 shadow-xl">
                <Building2 className="h-8 w-8 text-teal-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {currentProposal.company?.name || "Agencia Asociada"}
              </h2>
              <p className="text-sm text-teal-400 flex items-center gap-1.5 mt-1 font-mono uppercase tracking-wider">
                <Lock className="h-3.5 w-3.5" /> Enlace Seguro y Privado
              </p>
            </div>
          </div>
          {isSigned && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.15)]">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              <span className="text-teal-300 text-sm font-semibold tracking-wide">
                DOCUMENTO FIRMADO
              </span>
            </div>
          )}
        </header>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800/80 mb-12"
        >
          <div className="p-8 md:p-12 lg:p-16">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                  {currentProposal.title}
                </h1>
                <div className="space-y-2 text-slate-400">
                  <p className="text-lg flex items-center gap-2">
                    <span className="text-slate-500">Preparado para:</span>
                    <strong className="text-slate-200">
                      {currentProposal.contactName ||
                        currentProposal.contactEmail}
                    </strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>
                      Emitido el{" "}
                      {new Date(currentProposal.createdAt).toLocaleDateString(
                        "es-ES",
                        { year: "numeric", month: "long", day: "numeric" },
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 min-w-[250px] shrink-0">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">
                  Inversión Total
                </p>
                <div className="text-3xl font-mono font-bold text-teal-400 flex items-end gap-2">
                  ${currentProposal.value.toLocaleString()}
                  <span className="text-sm font-sans font-medium text-slate-500 mb-1">
                    {currentProposal.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-slate-800 via-slate-700/50 to-slate-800 mb-12" />

            {/* Rich Text Area */}
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed space-y-6 prose-headings:text-white prose-a:text-teal-400 prose-strong:text-slate-100">
              {currentProposal.content ? (
                <BlogContentViewer content={currentProposal.content} />
              ) : (
                <p className="italic text-slate-500 bg-slate-950 p-6 rounded-lg text-center">
                  Detalles del alcance no proporcionados.
                </p>
              )}
            </div>

            {/* Items Table */}
            {currentProposal.items && currentProposal.items.length > 0 && (
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <TerminalSquare className="h-6 w-6 text-teal-400" />
                  Desglose de Cotización
                </h3>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                  <table className="min-w-full divide-y divide-slate-800/80">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Concepto y Descripción
                        </th>
                        <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Cant.
                        </th>
                        <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Inversión
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {currentProposal.items.map((item: any) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-900 transition-colors"
                        >
                          <td className="px-8 py-6">
                            <div className="font-semibold text-lg text-slate-200 mb-1">
                              {item.title}
                            </div>
                            {item.description && (
                              <div className="text-sm text-slate-400 leading-relaxed">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="inline-flex items-center justify-center bg-slate-800 text-slate-300 rounded-md h-8 w-8 font-mono text-sm border border-slate-700">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right text-slate-300 font-mono text-lg">
                            ${(item.price * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-8 py-6 text-right font-bold text-slate-500 uppercase tracking-widest"
                        >
                          Total Acordado:
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-teal-400 text-2xl font-mono">
                          ${currentProposal.value.toLocaleString()}{" "}
                          <span className="text-sm text-slate-500 font-sans">
                            {currentProposal.currency}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <footer className="text-center text-slate-600 text-sm flex items-center justify-center gap-2 mb-8">
          <Lock className="h-4 w-4 opacity-50" />
          Auditoría Digital Protegida por Blockchain & LegacyMark
        </footer>
      </div>

      {/* STICKY ACTION FOOTER */}
      {!isSigned && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 md:p-6 z-40 transform transition-transform shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex justify-center">
          <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-400 text-sm flex-1">
              <p className="font-medium text-slate-200">
                ¿Estás listo para comenzar?
              </p>
              <p className="opacity-80 hidden md:block mt-0.5">
                Al firmar digitalmente, aceptas los términos detallados en este
                documento comercial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSignature(true)}
              className="w-full md:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all flex items-center justify-center gap-3 group"
            >
              Aceptar y Firmar Propuesta
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setShowSignature(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-800 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Firma Digital</h3>
                <button
                  type="button"
                  onClick={() => setShowSignature(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-slate-300 mb-6">
                Dibuja tu firma en el área siguiente:
              </p>

              <div className="border-2 border-dashed border-slate-700 rounded-lg overflow-hidden bg-slate-950 mb-6">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    className: "w-full h-40 cursor-crosshair bg-slate-950",
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Procesando..." : "Aceptar y Firmar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
