import { Metadata } from 'next';
import { InventoryClient } from './inventory-client';

export const metadata: Metadata = {
  title: 'Inventario & Bodegas | LegacyMark',
  description: 'Control multisede de existencias, kárdex contable y traslados de mercancía',
};

export default function InventoryPage() {
  return (
    <div className="ds-page w-full">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <InventoryClient />
      </div>
    </div>
  );
}
