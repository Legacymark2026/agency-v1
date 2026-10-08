import { Metadata } from 'next';
import { FinancialPoliciesClient } from './financial-policies-client';

export const metadata: Metadata = {
  title: 'Políticas de Control Financiero & Gobernanza | LegacyMark ERP',
  description: 'Configuración centralizada de umbrales de aprobación, políticas de compras, auditoría de calidad y directrices corporativas.',
};

export default function FinancialPoliciesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <FinancialPoliciesClient />
    </div>
  );
}
