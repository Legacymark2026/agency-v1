import { Metadata } from 'next';
import { PurchasesClient } from './purchases-client';

export const metadata: Metadata = {
  title: 'Módulo de Compras & Órdenes de Aprovisionamiento | LegacyMark ERP',
  description: 'Gestión integral de órdenes de compra (OC), acuerdos con proveedores, Incoterms 2020, multimoneda y trazabilidad logística.',
};

export default function PurchasesPage() {
  return (
    <div className="ds-page w-full">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <PurchasesClient />
      </div>
    </div>
  );
}
