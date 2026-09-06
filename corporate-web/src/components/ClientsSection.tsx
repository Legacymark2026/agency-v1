import Image from "next/image";
import { Building2, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface ClientItem {
  name: string;
  category: string;
  scope: string;
}

const clients: ClientItem[] = [
  {
    name: "SURA ARL",
    category: "Seguros & Riesgos Laborales",
    scope: "Gestión y prevención de riesgos laborales",
  },
  {
    name: "AXA Colpatria",
    category: "Servicios Financieros & Seguros",
    scope: "Plataforma operativa y control de procesos",
  },
  {
    name: "Contraloría General de Santander",
    category: "Sector Público & Control Fiscal",
    scope: "Gestión documental Cero Papel y trazabilidad",
  },
  {
    name: "Precocidos del Oriente",
    category: "Sector Agroalimentario & Manufactura",
    scope: "Sistemas Integrados de Gestión e Inocuidad HACCP",
  },
  {
    name: "Ayuda Profesional Ltda.",
    category: "Consultoría & Servicios Empresariales",
    scope: "Optimización operativa y control de personas",
  },
  {
    name: "Colegio Cooperativo Comfenalco",
    category: "Sector Educativo & Cooperativo",
    scope: "Ecosistema SG-SST y modernización administrativa",
  },
];

export default function ClientsSection() {
  return (
    <section className="py-20 bg-[#01426F] text-white border-y border-amber-900/30 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(176,138,26,0.12),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header exacto como la imagen provista */}
        <div className="text-center mb-12">
          <span className="font-serif italic text-lg sm:text-xl text-[#D4AF37] block mb-1">
            Algunos de
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-[0.25em] uppercase text-white">
            NUESTROS CLIENTES
          </h2>
          <div className="w-16 h-1 bg-[#B08A1A] mx-auto mt-4 rounded-full" />
        </div>

        {/* Banner de Logos Originales de la Empresa */}
        <div className="max-w-5xl mx-auto mb-14 bg-white/95 rounded-2xl p-4 sm:p-6 shadow-2xl border border-amber-500/30 backdrop-blur-sm">
          <div className="relative w-full aspect-[7/1] min-h-[70px] sm:min-h-[100px] flex items-center justify-center overflow-hidden">
            <Image
              src="/images/nuestros-clientes.png"
              alt="Algunos de Nuestros Clientes - NeoGestión"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Tarjetas interactivas de clientes con sector y alcance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {clients.map((client, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-[#B08A1A] transition-all duration-300 group hover:-translate-y-1 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-[#B08A1A]/30 text-[#D4AF37] flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                    Cliente Corporativo
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                  {client.name}
                </h3>
                <span className="text-xs text-[#B08A1A] font-semibold block mb-3">
                  {client.category}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {client.scope}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confianza y Respaldo NeoGestión</span>
              </div>
            </div>
          ))}
        </div>

        {/* Respaldo Institucional */}
        <div className="mt-12 text-center">
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B08A1A] shrink-0" />
            <span>
              Empresas del sector público, salud, aseguramiento y manufactura gestionan sus procesos con NeoGestión.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
