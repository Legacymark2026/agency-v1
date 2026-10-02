import { Metadata } from 'next';
import { DianClient } from './dian-client';

export const metadata: Metadata = {
  title: 'Cumplimiento Fiscal DIAN | LegacyMark',
  description: 'Monitor de facturación electrónica UBL 2.1, documento equivalente POS y nómina electrónica',
};

export default function DianPage() {
  return <DianClient />;
}
