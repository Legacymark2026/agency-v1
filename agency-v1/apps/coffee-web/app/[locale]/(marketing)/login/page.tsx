import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";
import CookieConsent from "@/components/sections/CookieConsent";
import AuthForm from "@/components/sections/AuthForm";

export const dynamic = "force-dynamic";

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
      title: "Iniciar Sesión | Goldneez",
      description: "Inicia sesión en tu cuenta de café Goldneez y gestiona tus pedidos."
    };
  }

  return {
    title: `Mi Cuenta | Goldneez`,
    description: t("description"),
  };
}

export default function LoginPage() {
  return (
    <div className="relative bg-black min-h-screen flex flex-col justify-between">
      {/* Skip Link */}
      <a
        href="#login-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber focus:text-black focus:px-6 focus:py-3 focus:font-bold focus:text-sm focus:uppercase"
      >
        Saltar al formulario de acceso
      </a>

      <Header />
      
      <main id="login-main" className="flex-1 flex items-center justify-center pt-28 pb-10">
        <AuthForm />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
