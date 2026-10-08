import { Metadata } from 'next';
import { SuppliersClient } from './suppliers-client';

export const metadata: Metadata = {
  title: 'Proveedores & Homologación Comercial | LegacyMark ERP',
  description: 'Gestión maestra de proveedores, cumplimiento documental (RUT, Cámara de Comercio) y acuerdos de crédito.',
};

export default function SuppliersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <SuppliersClient />
    </div>
  );
}
