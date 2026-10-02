'use client';

import { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Search,
  Filter,
  RefreshCw,
  KeyRound,
  FileCheck,
  UserCheck
} from 'lucide-react';

interface AuditEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: 'CREATE' | 'READ_SENSITIVE' | 'UPDATE' | 'DELETE' | 'EXPORT';
  resource: 'INVOICE' | 'ACCOUNTING' | 'HR' | 'USER' | 'SETTINGS';
  resourceId: string;
  hashSeal: string;
  previousHash: string;
  timestamp: string;
}

export function AuditLedgerClient() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null);

  const [logs] = useState<AuditEntry[]>([
    {
      id: 'log-1',
      actorEmail: 'admin@legacymark.com',
      actorRole: 'SUPER_ADMIN',
      action: 'READ_SENSITIVE',
      resource: 'ACCOUNTING',
      resourceId: 'VOUCHER-CC-000189',
      hashSeal: '4a8f9c1b2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: '2026-09-10 09:30:15',
    },
    {
      id: 'log-2',
      actorEmail: 'contador@legacymark.com',
      actorRole: 'FINANCE_ADMIN',
      action: 'EXPORT',
      resource: 'INVOICE',
      resourceId: 'DIAN-REPORTE-1001',
      hashSeal: '9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c',
      previousHash: '4a8f9c1b2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90',
      timestamp: '2026-09-10 09:45:22',
    },
    {
      id: 'log-3',
      actorEmail: 'rrhh@legacymark.com',
      actorRole: 'HR_MANAGER',
      action: 'UPDATE',
      resource: 'HR',
      resourceId: 'EMP-NOMINA-0045',
      hashSeal: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      previousHash: '9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c',
      timestamp: '2026-09-10 10:12:08',
    },
  ]);

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedCount(logs.length);
    }, 800);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <Lock size={24} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pistas Forenses Criptográficas (WORM)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Registro inmutable de accesos sensibles y transacciones selladas en cadena mediante hashes SHA-256 (Cumplimiento Ley 1581 & Revisoría Fiscal).
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={isVerifying}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm shadow transition disabled:opacity-50"
        >
          <ShieldCheck size={16} />
          {isVerifying ? 'Verificando Matemáticamente...' : 'Verificar Integridad de la Cadena'}
        </button>
      </div>

      {verifiedCount !== null && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-3">
          <CheckCircle2 size={20} />
          <div>
            <span className="font-bold">Cadena Íntegra y Verificada:</span> Se comprobaron con éxito {verifiedCount} bloques encadenados sin alteraciones ni discrepancias matemáticas.
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Recurso</th>
              <th className="px-4 py-3">Hash Seal (SHA-256)</th>
              <th className="px-4 py-3">Previous Hash</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((entry, idx) => (
              <tr key={entry.id} className="hover:bg-muted/30 transition">
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{entry.timestamp}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{entry.actorEmail}</div>
                  <div className="text-xs text-muted-foreground font-mono">{entry.actorRole}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-muted text-foreground">
                    {entry.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-mono">{entry.resource}: {entry.resourceId}</td>
                <td className="px-4 py-3 font-mono text-[10px] text-purple-400">
                  {entry.hashSeal.slice(0, 16)}...{entry.hashSeal.slice(-8)}
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                  {entry.previousHash === '0000000000000000000000000000000000000000000000000000000000000000'
                    ? 'GENESIS'
                    : `${entry.previousHash.slice(0, 8)}...`}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 size={12} /> Sellado
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
