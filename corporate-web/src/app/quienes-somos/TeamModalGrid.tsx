"use client";

import { useState } from "react";
import { X, ExternalLink, Award, CheckCircle2 } from "lucide-react";
import { teamData, TeamMember } from "@/data/teamData";

export default function TeamModalGrid() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <div>
      {/* Grid de Miembros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {teamData.map((member) => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="cursor-pointer group bg-[#0B192C] rounded-3xl border border-slate-800 overflow-hidden shadow-lg hover:border-[#B08A1A] transition-all duration-300 flex flex-col hover:-translate-y-1.5"
          >
            {/* Foto con efecto Reveal (borde dorado en hover) */}
            <div className="h-72 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.avatar}
                alt={member.name}
                className="w-full h-full object-cover object-top filter grayscale contrast-110 group-hover:filter-none group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#0B192C]/80 px-2.5 py-1 rounded-md border border-[#B08A1A]/30">
                  Ver perfil completo
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-[#B08A1A] mb-1.5">{member.role}</p>
                <p className="text-xs text-slate-400 font-medium mb-3">{member.specialty}</p>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {member.bio}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Hacer clic para biografía</span>
                <span className="w-2 h-2 rounded-full bg-[#B08A1A] group-hover:scale-150 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Biografía Completa */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B192C] text-white border border-[#B08A1A] rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedMember.avatar}
                alt={selectedMember.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#B08A1A] shadow-md shrink-0"
              />
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-1">
                  Perfil Directivo
                </span>
                <h3 className="text-2xl font-black text-white">{selectedMember.name}</h3>
                <p className="text-sm font-semibold text-[#B08A1A] mb-1">{selectedMember.role}</p>
                <p className="text-xs text-slate-400">{selectedMember.specialty}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-200 leading-relaxed mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Trayectoria Profesional
              </h4>
              <p>{selectedMember.fullBio}</p>

              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Logros y Credenciales Destacadas</span>
                </h4>
                <div className="space-y-2">
                  {selectedMember.achievements.map((ach, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <a
                href={selectedMember.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:text-white transition-colors"
              >
                <span>Ver perfil en LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
