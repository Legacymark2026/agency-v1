import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEOGESTIÓN | Transformamos la complejidad en eficiencia",
  description:
    "Firma de consultoría de élite para alta dirección y comités ejecutivos. Especialistas en estrategia corporativa, modernización cloud, inteligencia de negocio y ciberseguridad.",
  keywords: [
    "NEOGESTIÓN",
    "consultoría estratégica",
    "eficiencia corporativa",
    "transformación digital",
    "inteligencia de datos",
    "ciberseguridad corporativa",
    "optimización de procesos",
  ],
  authors: [{ name: "NEOGESTIÓN" }],
  openGraph: {
    title: "NEOGESTIÓN | Transformamos la complejidad en eficiencia",
    description:
      "Soluciones estratégicas de alto nivel para comités directivos y empresas líderes. Rigor analítico y cercanía ejecutiva.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-[#B08A1A] selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <AnalyticsTracker />
      </body>
    </html>
  );
}
