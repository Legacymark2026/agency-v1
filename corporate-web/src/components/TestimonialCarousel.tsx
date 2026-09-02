"use client";

import { useState } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { testimonialsData } from "@/data/testimonialsData";

export default function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);

  const prev = () => {
    setActiveIndex((curr) => (curr === 0 ? testimonialsData.length - 1 : curr - 1));
  };

  const next = () => {
    setActiveIndex((curr) => (curr === testimonialsData.length - 1 ? 0 : curr + 1));
  };

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* 3D Coverflow Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {testimonialsData.map((item, idx) => {
          const isCenter = idx === activeIndex;
          return (
            <div
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`cursor-pointer transition-all duration-500 rounded-3xl p-8 border ${
                isCenter
                  ? "bg-[#0B192C] text-white border-[#B08A1A] shadow-2xl scale-105 z-10 gold-glow ring-1 ring-[#B08A1A]/40"
                  : "bg-slate-50 text-slate-700 border-slate-200 opacity-65 hover:opacity-90 scale-95 hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Quote
                  className={`w-7 h-7 ${
                    isCenter ? "text-[#D4AF37]" : "text-slate-400"
                  }`}
                />
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    isCenter
                      ? "bg-amber-500/20 text-[#D4AF37] border border-[#B08A1A]/30"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.companyLogoText}
                </span>
              </div>

              <p
                className={`text-sm leading-relaxed mb-6 italic ${
                  isCenter ? "text-slate-200" : "text-slate-600"
                }`}
              >
                “{item.quote}”
              </p>

              <div
                className={`pt-5 border-t ${
                  isCenter ? "border-slate-800" : "border-slate-200"
                }`}
              >
                <div className="mb-4">
                  <span
                    className={`text-2xl font-black block leading-none ${
                      isCenter ? "text-[#D4AF37]" : "text-[#0B192C]"
                    }`}
                  >
                    {item.metric}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.metricLabel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.avatar}
                    alt={item.author}
                    className="w-10 h-10 rounded-full object-cover border border-[#B08A1A]/40"
                  />
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isCenter ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.author}
                    </h4>
                    <p className="text-[11px] text-slate-400">{item.role}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          type="button"
          onClick={prev}
          aria-label="Testimonio anterior"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#B08A1A] hover:border-[#B08A1A] flex items-center justify-center transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {testimonialsData.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Ir a testimonio ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-8 bg-[#B08A1A]" : "w-2 bg-slate-300"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Testimonio siguiente"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#B08A1A] hover:border-[#B08A1A] flex items-center justify-center transition-colors shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
