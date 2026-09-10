'use client';

import { useState } from 'react';
import {
  FileCheck,
  ShieldCheck,
  QrCode,
  FileCode2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
  Search,
  Filter,
  Layers,
  Award,
  Zap,
  RefreshCw,
  Send
} from 'lucide-react';

interface DianDoc {
  id: string;
  number: string;
  type: 'FACTURA_UBL21' | 'POS_EQUIVALENTE' | 'NOMINA_ELECTRONICA';
  client: string;
  nit: string;
  amount: number;
  cufe: string;
  date: string;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

interface Resolution {
  id: string;
  prefix: string;
  resolutionNumber: string;
  from: number;
  to: number;
  current: number;
  validTo: string;
  daysRemaining: number;
}

export function DianClient() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'resolutions' | 'radian'>('monitor');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedXmlDoc, setSelectedXmlDoc] = useState<DianDoc | null>(null);

  const [documents] = useState<DianDoc[]>([
    {
      id: 'doc-1',
      number: 'SETP-000189',
      type: 'FACTURA_UBL21',
      client: 'Bancolombia S.A.',
      nit: '890903938-8',
      amount: 14500000,
      cufe: 'a38f7c9b0e12d45a789bcde34567890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      date: '2026-09-10 09:14',
      status: 'ACCEPTED',
    },
    {
      id: 'doc-2',
      number: 'POS-008921',
      type: 'POS_EQUIVALENTE',
      client: 'Consumidor Final',
      nit: '222222222222',
      amount: 145000,
      cufe: 'c49e8a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      date: '2026-09-10 10:02',
      status: 'ACCEPTED',
    },
    {
      id: 'doc-3',
      number: 'NOM-000045',
      type: 'NOMINA_ELECTRONICA',
      client: 'Carlos Eduardo Restrepo',
      nit: '1020304050',
      amount: 4200000,
      cufe: 'f12a34b56c78d90e1234567890abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      date: '2026-09-05 18:30',
      status: 'ACCEPTED',
    },
  ]);

  const resolutions: Resolution[] = [
    { id: 'res-1', prefix: 'SETP', resolutionNumber: '18764000001', from: 1, to: 5000, current: 189, validTo: '2027-04-15', daysRemaining: 217 },
    { id: 'res-2', prefix: 'POS', resolutionNumber: '18764000099', from: 1, to: 50000, current: 8921, validTo: '2027-08-30', daysRemaining: 354 },
    { id: 'res-3', prefix: 'NC', resolutionNumber: '18764000045', from: 1, to: 1000, current: 12, validTo: '2027-04-15', daysRemaining: 217 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <ShieldCheck size={24} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cumplimiento Fiscal DIAN (UBL 2.1)</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Motor de emisión de Facturación Electrónica, Documento Equivalente POS, Nómina y eventos RADIAN.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={14} /> Servicio DIAN Operativo (Ambiente Habilitado)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Documentos Validados</span>
            <FileCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">1,248</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" /> 100% de éxito en recepción
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Resoluciones Vigentes</span>
            <Award size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">3 Activas</div>
          <div className="text-xs text-muted-foreground mt-1">SETP, POS y Notas Crédito</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Firma Digital XAdES-BES</span>
            <ShieldCheck size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">Válida</div>
          <div className="text-xs text-muted-foreground mt-1">Certificado GSE / Andes SCD</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Eventos RADIAN</span>
            <Zap size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">15 Aceptados</div>
          <div className="text-xs text-muted-foreground mt-1">Títulos valores para factoring</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-6">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'monitor'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileCheck size={16} />
          Monitor de Documentos Electrónicos
        </button>
        <button
          onClick={() => setActiveTab('resolutions')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'resolutions'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award size={16} />
          Resoluciones DIAN & Rangos
        </button>
        <button
          onClick={() => setActiveTab('radian')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'radian'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap size={16} />
          Bandeja RADIAN (Facturas Proveedores)
        </button>
      </div>

      {/* Tab: Monitor */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Adquiriente / Empleado</th>
                  <th className="px-4 py-3 text-right">Monto Total</th>
                  <th className="px-4 py-3">CUFE / CUNE</th>
                  <th className="px-4 py-3">Fecha Emisión</th>
                  <th className="px-4 py-3 text-center">Estado DIAN</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{doc.number}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-muted text-foreground">
                        {doc.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{doc.client}</div>
                      <div className="text-xs text-muted-foreground font-mono">NIT: {doc.nit}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      $${doc.amount.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                      {doc.cufe.slice(0, 16)}...{doc.cufe.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{doc.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={12} /> Validado
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedXmlDoc(doc)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
                        title="Ver XML UBL 2.1"
                      >
                        <FileCode2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Resolutions */}
      {activeTab === 'resolutions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resolutions.map(res => {
            const percentage = Math.round((res.current / res.to) * 100);
            return (
              <div key={res.id} className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded">
                    Prefijo: {res.prefix}
                  </span>
                  <span className="text-xs text-muted-foreground">Res. #{res.resolutionNumber}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Folios usados: {res.current} de {res.to}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t border-border flex justify-between">
                  <span>Vence: {res.validTo}</span>
                  <span className="text-emerald-500 font-medium">{res.daysRemaining} días restantes</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* XML Viewer Modal */}
      {selectedXmlDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileCode2 size={20} className="text-blue-500" />
                XML Estándar UBL 2.1 — {selectedXmlDoc.number}
              </h3>
              <button onClick={() => setSelectedXmlDoc(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96 text-foreground">
              {selectedXmlDoc.cufe ? (
                <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ID>${selectedXmlDoc.number}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${selectedXmlDoc.cufe}</cbc:UUID>
  <cbc:IssueDate>${selectedXmlDoc.date.split(' ')[0]}</cbc:IssueDate>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:RegistrationName>${selectedXmlDoc.client}</cbc:RegistrationName>
      <cbc:CompanyID>${selectedXmlDoc.nit}</cbc:CompanyID>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="COP">${selectedXmlDoc.amount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`}</pre>
              ) : 'No XML available'}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedXmlDoc(null)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
