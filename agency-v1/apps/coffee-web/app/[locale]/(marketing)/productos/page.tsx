import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";
import CookieConsent from "@/components/sections/CookieConsent";
import ProductsCatalog from "@/components/sections/ProductsCatalog";

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
      title: "Colección de Especialidad | Goldneez",
      description: "Explora la colección de cafés de especialidad tostados artesanalmente por Goldneez."
    };
  }

  return {
    title: `Colección de Especialidad | Goldneez`,
    description: t("description"),
  };
}

export default function ProductosPage() {
  return (
    <div className="relative bg-black min-h-screen">
      {/* Accessibility skip link */}
      <a
        href="#catalog-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber focus:text-black focus:px-6 focus:py-3 focus:font-bold focus:text-sm focus:uppercase"
      >
        Saltar al catálogo de productos
      </a>

      <Header />
      
      <main id="catalog-main">
        <ProductsCatalog />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
