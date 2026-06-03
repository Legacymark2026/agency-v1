import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";
import CookieConsent from "@/components/sections/CookieConsent";
import UserDashboard from "@/components/sections/UserDashboard";

export const dynamic = "force-static";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  let t;
  try {
    t = await getTranslations({ locale, namespace: "metadata" });
  } catch (e) {
    return {
      title: "Mi Panel de Especialidad | Goldneez",
      description: "Administra tus suscripciones de café, historial de pedidos y puntos acumulados."
    };
  }

  return {
    title: `Panel de Usuario | Goldneez`,
    description: t("description"),
  };
}

export default function DashboardPage() {
  return (
    <div className="relative bg-black min-h-screen flex flex-col justify-between">
      {/* Skip Link */}
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber focus:text-black focus:px-6 focus:py-3 focus:font-bold focus:text-sm focus:uppercase"
      >
        Saltar al panel principal
      </a>

      <Header />
      
      <main id="dashboard-main" className="flex-1 pt-32 pb-20 px-6 sm:px-10 lg:px-20">
        <UserDashboard />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
