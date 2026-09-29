import type { Metadata } from "next";
import PlatformAccessSection from "@/components/PlatformAccessSection";

export const metadata: Metadata = {
  title: "Acceso a Plataformas | NEOGESTIÓN",
  description:
    "Acceda de forma segura a la plataforma principal de NeoGestión o a su instancia corporativa independiente. Puntos de entrada al ecosistema de gestión integral.",
  openGraph: {
    title: "Acceso a Plataformas | NEOGESTIÓN",
    description:
      "Portal centralizado de acceso a las plataformas de gestión integral NeoGestión para empresas y entidades.",
  },
};

export default function AccesosPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <PlatformAccessSection />
    </main>
  );
}
