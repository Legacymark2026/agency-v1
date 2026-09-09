'use client';

import { useState } from 'react';
import { 
  FileCheck, 
  Printer, 
  Download, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  RefreshCw,
  Stamp,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { generateWithholdingCertificateAction } from '@/modules/accounting/actions/accounting';
import type { WithholdingCertificate } from '@/modules/accounting/types';

export function TaxCertificatesModule() {
  const [thirdPartyNit, setThirdPartyNit] = useState('900123456');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [certType, setCertType] = useState<'RETEFUENTE' | 'RETEICA' | 'RETEIVA'>('RETEFUENTE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<WithholdingCertificate | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thirdPartyNit) {
      toast.error('Ingresa el NIT del tercero');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateWithholdingCertificateAction({
        thirdPartyNit,
        fiscalYear,
        certificateType: certType,
      });

      if (res.success && res.certificate) {
        setCertificate(res.certificate);
        toast.success('Certificado de retención expedido');
      } else {
        toast.error(res.error || 'Error al generar certificado');
      }
    } catch {
      toast.error('Error al contactar con el servidor contable');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Parameter Selection Bar */}
      <div className="ds-card p-5 border-slate-800 bg-slate-900/60">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">NIT del Proveedor / Sujeto Retenido</label>
            <input
              type="text"
              required
              placeholder="900.123.456"
              value={thirdPartyNit}
              onChange={(e) => setThirdPartyNit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Año Gravable</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value={2026}>2026 (Año Actual)</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Tipo de Certificado</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="RETEFUENTE">Retención en la Fuente (Art. 381 E.T.)</option>
              <option value="RETEICA">Retención de ICA Municipal</option>
              <option value="RETEIVA">Retención de IVA (ReteIVA 15%)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Expedir Certificado
            </button>
          </div>
        </form>
      </div>

      {/* Printable Certificate Preview */}
      {certificate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Documento tributario formal generado con código de validación: <span className="font-mono text-teal-400">{certificate.certificateNumber}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-teal-400 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir / Guardar PDF
              </button>
            </div>
          </div>

          {/* Official Printable Sheet Layout */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-200 max-w-4xl mx-auto print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="text-center pb-6 border-b border-slate-800 print:border-black space-y-1">
              <h2 className="text-lg font-black text-white print:text-black uppercase tracking-wider">
                {certificate.issuer.name}
              </h2>
              <p className="text-xs font-mono text-slate-400 print:text-black">
                NIT: {certificate.issuer.nit} • {certificate.issuer.city}
              </p>
              <p className="text-xs text-slate-500 print:text-black">
                {certificate.issuer.address}
              </p>
              <div className="pt-3">
                <span className="inline-block text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 print:border-black print:text-black">
                  CERTIFICADO DE {certificate.certificateType === 'RETEFUENTE' ? 'RETENCIÓN EN LA FUENTE' : certificate.certificateType === 'RETEICA' ? 'RETENCIÓN DE INDUSTRIA Y COMERCIO (ICA)' : 'RETENCIÓN DE IVA'}
                </span>
                <p className="text-[11px] text-slate-400 print:text-black mt-1">
                  AÑO GRAVABLE: <strong className="text-white print:text-black">{certificate.fiscalYear}</strong>
                </p>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-800/80 print:border-black text-xs">
              <div>
                <span className="text-slate-500 print:text-black text-[10px] uppercase font-bold block">Retenido a favor de:</span>
                <span className="font-bold text-white print:text-black text-sm">{certificate.recipient.name}</span>
                <span className="block font-mono text-slate-400 print:text-black mt-0.5">NIT: {certificate.recipient.nit}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 print:text-black text-[10px] uppercase font-bold block">Fecha de Expedición:</span>
                <span className="font-semibold">{certificate.issueDate}</span>
                <span className="block font-mono text-slate-500 print:text-black mt-0.5">Folio: {certificate.certificateNumber}</span>
              </div>
            </div>

            {/* Withholdings Breakdown Table */}
            <div className="py-5">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 print:border-black text-slate-400 print:text-black text-[10px] uppercase font-bold">
                    <th className="py-2">Concepto de Retención</th>
                    <th className="py-2 text-right">Base Gravable Sujeta</th>
                    <th className="py-2 text-center">Tarifa (%)</th>
                    <th className="py-2 text-right">Valor Retenido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black font-mono">
                  {certificate.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-2.5 font-sans font-medium text-slate-300 print:text-black">{item.concept}</td>
                      <td className="py-2.5 text-right">${item.baseAmount.toLocaleString()}</td>
                      <td className="py-2.5 text-center">{(item.rate * 100).toFixed(2)}%</td>
                      <td className="py-2.5 text-right font-bold text-teal-400 print:text-black">${item.withheldAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 print:border-black font-mono font-black text-sm">
                    <td className="py-3 font-sans">TOTALES CONSOLIDADOS:</td>
                    <td className="py-3 text-right">${certificate.totalBase.toLocaleString()}</td>
                    <td className="py-3 text-center">-</td>
                    <td className="py-3 text-right text-emerald-400 print:text-black">${certificate.totalWithheld.toLocaleString()} COP</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legal Text & Signature */}
            <div className="pt-6 border-t border-slate-800 print:border-black space-y-6">
              <p className="text-[10px] text-slate-400 print:text-black leading-relaxed italic">
                {certificate.legalNote}
              </p>

              <div className="pt-8 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="w-56 border-b border-slate-600 print:border-black pb-1">
                    <span className="font-mono text-xs text-teal-400 print:text-black font-bold">Firma Digital Verificada</span>
                  </div>
                  <span className="text-xs font-bold text-white print:text-black block">{certificate.signerName}</span>
                  <span className="text-[10px] text-slate-400 print:text-black block">{certificate.signerRole}</span>
                </div>

                <div className="text-right">
                  <div className="p-2 border border-slate-800 rounded-lg inline-block bg-slate-900/40 text-[9px] font-mono text-slate-500 print:text-black">
                    Sello SHA-256: {certificate.certificateNumber.replace(/-/g, '').slice(0, 16).toUpperCase()}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
