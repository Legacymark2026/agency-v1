"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalAccordionProps {
  title: string;
  subtitle: string;
  sections: LegalSection[];
  activeDoc: "privacidad" | "terminos" | "cookies";
}

export default function LegalAccordion({
  title,
  subtitle,
  sections,
  activeDoc,
}: LegalAccordionProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [sections[0]?.id || ""]: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    sections.forEach((s) => (all[s.id] = true));
    setOpenSections(all);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Índice Sticky Lateral */}
      <aside className="lg:col-span-4 sticky top-28 space-y-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B08A1A]">
            <ShieldCheck className="w-4 h-4" />
            <span>Marco Regulatorio</span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Documentos Legales
          </h3>

          <nav className="space-y-1.5 text-xs font-semibold">
            <a
              href="/privacidad"
              className={`block p-3 rounded-xl transition-colors ${
                activeDoc === "privacidad"
                  ? "bg-[#0B192C] text-[#D4AF37] border border-[#B08A1A]/40"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              1. Política de Privacidad &amp; RGPD
            </a>
            <a
              href="/terminos"
              className={`block p-3 rounded-xl transition-colors ${
                activeDoc === "terminos"
                  ? "bg-[#0B192C] text-[#D4AF37] border border-[#B08A1A]/40"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              2. Términos y Condiciones
            </a>
            <a
              href="/cookies"
              className={`block p-3 rounded-xl transition-colors ${
                activeDoc === "cookies"
                  ? "bg-[#0B192C] text-[#D4AF37] border border-[#B08A1A]/40"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              3. Política de Cookies
            </a>
          </nav>

          <div className="pt-4 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] font-bold text-[#B08A1A] hover:underline"
            >
              Expandir todo
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] font-bold text-slate-500 hover:underline"
            >
              Colapsar todo
            </button>
          </div>
        </div>
      </aside>

      {/* Acordeón de Cláusulas */}
      <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
            NEOGESTIÓN Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
        </div>

        {/* Acordeón interactivo */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {sections.map((section) => {
            const isOpen = !!openSections[section.id];
            return (
              <div
                key={section.id}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-5 text-left flex items-center justify-between bg-slate-50/60 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#B08A1A] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="p-6 text-sm text-slate-700 leading-relaxed border-t border-slate-200 bg-white">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
