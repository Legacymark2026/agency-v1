import { Metadata } from 'next';
import { PurchasesClient } from './purchases-client';

export const metadata: Metadata = {
  title: 'Módulo de Compras & Órdenes de Aprovisionamiento | LegacyMark ERP',
  description: 'Gestión integral de órdenes de compra (OC), acuerdos con proveedores, Incoterms 2020, multimoneda y trazabilidad logística.',
};

export default function PurchasesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PurchasesClient />
    </div>
  );
}
