"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  Trees, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  DollarSign
} from "lucide-react";

export default function RoiCalculator() {
  const [usersCount, setUsersCount] = useState<number>(65);
  const [traditionalCostPerUser, setTraditionalCostPerUser] = useState<number>(25); // USD / user / month
  const [paperReamsMonth, setPaperReamsMonth] = useState<number>(20); // reams of 500 sheets

  // Calculations
  // Traditional licensing cost: users * cost * 12
  const annualLicensingTraditional = usersCount * traditionalCostPerUser * 12;
  // NeoGestión licensing: $0 per user
  const annualLicensingNeoGestion = 0;
  const annualLicensingSaved = annualLicensingTraditional - annualLicensingNeoGestion;

  // Paper & storage savings:
  // 1 ream = 500 sheets. ~8 USD per ream including printing toner & physical storage
  const annualPaperSheets = paperReamsMonth * 500 * 12;
  const annualPaperCost = paperReamsMonth * 8 * 12;
  // ~16 reams = 1 tree
  const treesSaved = Math.max(1, Math.round((paperReamsMonth * 12) / 16));

  // Time savings:
  // ~4 hours per collaborator per month saved in physical routing, signature chasing & audit compilation
  const annualHoursSaved = Math.round(usersCount * 3.5 * 12);

  // Total estimated financial value saved
  const totalFinancialSaved = annualLicensingSaved + annualPaperCost;

  return (
    <section id="calculadora-ahorro" className="py-24 bg-gradient-to-b from-slate-900 via-[#012540] to-slate-900 text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(176,138,26,0.15),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-4">
            <Calculator className="w-4 h-4 text-[#D4AF37]" />
            <span>Herramienta Ejecutiva para Comités Directivos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Calculadora de Retorno de Inversión (ROI) &amp; Cero Papel
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Estime en segundos el impacto financiero, operativo y ecológico de eliminar el sobrecosto por usuario y digitalizar su Sistema de Gestión.
          </p>
        </div>

        {/* Calculator Body: 2 Columns (Inputs vs Executive Results) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls Column */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Parámetros de su Organización</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Modifique los valores</span>
              </div>

              {/* Slider 1: Users Count */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="users-slider" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span>Colaboradores / Usuarios activos</span>
                  </label>
                  <span className="text-xl font-black text-[#D4AF37] font-mono bg-amber-500/10 px-3 py-0.5 rounded-lg border border-[#B08A1A]/30">
                    {usersCount} personas
                  </span>
                </div>
                <input
                  id="users-slider"
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={usersCount}
                  onChange={(e) => setUsersCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>10 (Pyme)</span>
                  <span>150 (Mediana)</span>
                  <span>500+ (Corporación)</span>
                </div>
              </div>

              {/* Slider 2: Traditional Cost per user */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="cost-slider" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                    <span>Costo mensual por usuario (Software tradicional)</span>
                  </label>
                  <span className="text-xl font-black text-[#D4AF37] font-mono bg-amber-500/10 px-3 py-0.5 rounded-lg border border-[#B08A1A]/30">
                    ${traditionalCostPerUser} USD
                  </span>
                </div>
                <input
                  id="cost-slider"
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={traditionalCostPerUser}
                  onChange={(e) => setTraditionalCostPerUser(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>$5 (Básico)</span>
                  <span>$25 (Promedio SaaS)</span>
                  <span>$80 (ERP pesado)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 italic">
                  *Con NeoGestión este rubro pasa a <strong className="text-[#D4AF37]">$0 USD</strong> por usuario, con accesos ilimitados.
                </p>
              </div>

              {/* Slider 3: Paper reams */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="paper-slider" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Trees className="w-4 h-4 text-[#D4AF37]" />
                    <span>Resmas de papel consumidas al mes</span>
                  </label>
                  <span className="text-xl font-black text-[#D4AF37] font-mono bg-amber-500/10 px-3 py-0.5 rounded-lg border border-[#B08A1A]/30">
                    {paperReamsMonth} resmas
                  </span>
                </div>
                <input
                  id="paper-slider"
                  type="range"
                  min="2"
                  max="100"
                  step="2"
                  value={paperReamsMonth}
                  onChange={(e) => setPaperReamsMonth(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>2 resmas (~1,000 hojas)</span>
                  <span>50 resmas</span>
                  <span>100+ resmas</span>
                </div>
              </div>
            </div>

            {/* Model Comparison Pill */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Diferencial de Modelo</span>
                <span className="text-emerald-400 text-[11px] font-mono">100% Predecible</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl text-rose-300">
                  <div className="font-bold text-slate-200">Otros Software:</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Penalizan su crecimiento cobrando por cada nuevo colaborador.</div>
                </div>
                <div className="bg-amber-500/10 border border-[#B08A1A]/40 p-2.5 rounded-xl text-[#D4AF37]">
                  <div className="font-bold text-white">NeoGestión:</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Usuarios ilimitados. Contrate o escale sin pagar licencias adicionales.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#01426F] via-[#042A46] to-[#01182B] border-2 border-[#B08A1A]/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-5 border-b border-amber-500/20 mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  Ahorro Total Estimado para su Organización
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  ROI DIRECTO
                </span>
              </div>

              {/* Big Impact Numbers */}
              <div className="mb-6">
                <div className="text-xs font-medium text-slate-300 mb-1">Ahorro anual directo en licencias y consumibles:</div>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight flex items-baseline gap-2">
                  <span className="text-gold-gradient">
                    ${totalFinancialSaved.toLocaleString("en-US")}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-300">USD / año</span>
                </div>
                <div className="text-xs text-amber-200/80 mt-1">
                  Equivalente aproximado a <strong>${(totalFinancialSaved * 4000).toLocaleString("es-CO")} COP</strong> anuales retenidos en su balance.
                </div>
              </div>

              {/* 3 Executive Metric Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {/* Tile 1 */}
                <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Licencias</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    ${annualLicensingSaved.toLocaleString("en-US")}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">$0 por usuario</div>
                </div>

                {/* Tile 2 */}
                <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Productividad</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {annualHoursSaved.toLocaleString("en-US")} h
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">Recuperadas / año</div>
                </div>

                {/* Tile 3 */}
                <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <Trees className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Sostenibilidad</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {treesSaved} Árboles
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">-{annualPaperSheets.toLocaleString()} hojas</div>
                </div>
              </div>

              {/* Executive summary points */}
              <div className="space-y-2 text-xs text-slate-200 mb-6 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sin sorpresas presupuestales ante contrataciones o crecimiento de nómina.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Auditorías ISO / SG-SST preparadas en minutos, no en semanas de impresión.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Firma electrónica válida con trazabilidad legal y custodia cloud de grado bancario.</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-5 border-t border-amber-500/20 flex flex-col sm:flex-row gap-3">
              <Link
                href="/contacto"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-lg gold-glow text-center"
              >
                <span>Solicitar Diagnóstico Institucional</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/573102187652?text=Hola,%20acabo%20de%20calcular%20mi%20ahorro%20en%20NeoGestión%20y%20me%20gustaría%20recibir%20una%20propuesta%20personalizada."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white text-sm font-semibold border border-[#B08A1A]/40 transition-colors text-center"
              >
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
