import { Metadata } from 'next';
import { AuditLedgerClient } from './audit-client';

export const metadata: Metadata = {
  title: 'Pistas Forenses Criptográficas | LegacyMark',
  description: 'Registro de auditoría inmutable WORM sellado con cadena SHA-256',
};

export default function AuditLedgerPage() {
  return <AuditLedgerClient />;
}
