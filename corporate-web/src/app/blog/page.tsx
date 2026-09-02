import type { Metadata } from "next";
import BlogFeed from "./BlogFeed";

export const metadata: Metadata = {
  title: "Magazine Corporativo & Análisis | NEOGESTIÓN",
  description:
    "Análisis directivos, tendencias de mercado, gobernanza y mejores prácticas en estrategia empresarial por los socios directores de NEOGESTIÓN.",
};

export default function BlogPage() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Banner */}
      <section className="bg-[#0B192C] text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(176,138,26,0.22),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Conocimiento &amp; Perspectiva Ejecutiva
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
            Magazine Corporativo NEOGESTIÓN
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Publicaciones de fondo sobre asignación de capital, transformación de operaciones, IA directiva y resiliencia estratégica.
          </p>
        </div>
      </section>

      {/* Contenido con buscador y filtros */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlogFeed />
        </div>
      </section>
    </div>
  );
}
