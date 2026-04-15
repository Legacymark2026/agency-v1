import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PublicPricingClient } from "@/components/marketing/pricing/PublicPricingClient";

export const metadata: Metadata = {
  title: "Tarifario | Agencia LegacyMark",
  description: "Conoce nuestros paquetes integrales y servicios creativos. Transparencia, calidad y precios enfocados al ROI.",
  openGraph: {
      title: "Tarifario | Agencia LegacyMark",
      description: "Servicios creativos y de marketing estructurados para maximizar el retorno de tu inversión.",
  }
};

// Revalidate every hour just in case, though Next.js 14+ is smart
export const revalidate = 3600;

export default async function PublicPricingPage() {
  // Fetch only active prices, ordered exactly how the admin dropped them
  // Note: For a robust multi-tenant system, this should filter by the URL param or domain.
  // Since we are creating a generic direct page, we extract the first company's data or all active global items.
  const servicesData = await prisma.servicePrice.findMany({
    where: {
      estado: "activo",
    },
    orderBy: [
      { orderIndex: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  return (
    <PublicPricingClient services={servicesData as any} />
  );
}
