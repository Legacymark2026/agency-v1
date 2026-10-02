import { Metadata } from 'next';
import { InventoryClient } from './inventory-client';

export const metadata: Metadata = {
  title: 'Inventario & Bodegas | LegacyMark',
  description: 'Control multisede de existencias, kárdex contable y traslados de mercancía',
};

export default function InventoryPage() {
  return <InventoryClient />;
}
