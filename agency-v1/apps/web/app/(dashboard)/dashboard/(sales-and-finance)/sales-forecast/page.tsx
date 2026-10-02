import { Metadata } from 'next';
import { SalesForecastClient } from './sales-forecast-client';

export const metadata: Metadata = {
  title: 'Proyección de Ventas & Tabulación de Descuentos | LegacyMark',
  description: 'Modelos predictivos de ventas Holt-Winters, simulación de escenarios y gestión de tablas de descuento con salvaguarda de margen',
};

export default function SalesForecastPage() {
  return <SalesForecastClient />;
}
