"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

interface ProcessStage {
  stage: string;
  title: string;
  time: string;
  temp: string;
  description: string;
  image: string;
}

const Process = () => {
  const t = useTranslations("process");
  const sectionRef = useRef<HTMLElement>(null);

  const stageImages = [
    "/images/process-1.jpg",
    "/images/process-2.jpg",
    "/images/process-3.jpg",
    "/images/process-4.jpg",
    "/images/process-5.jpg",
  ];

  const rawStages = t.raw("stages") as Array<{
    stage: string;
    title: string;
    time: string;
    temp: string;
    description: string;
  }>;

  const stages: ProcessStage[] = rawStages.map((stage, index) => ({
    ...stage,
    image: stageImages[index] || "/images/process-1.jpg",
  }));

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const title = sectionRef.current!.querySelector(".process-title");
      const subtitle = sectionRef.current!.querySelector(".process-subtitle");
      const cards = sectionRef.current!.querySelectorAll(".process-card");

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 1.0, ease: "power3.out",
            scrollTrigger: { trigger: title, start: "top 85%", once: true },
          }
        );
      }

      if (subtitle) {
        gsap.fromTo(
          subtitle,
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: "power3.out",
            scrollTrigger: { trigger: subtitle, start: "top 85%", once: true },
          }
        );
      }

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 80, rotateX: 10 },
          {
            opacity: 1, y: 0, rotateX: 0, duration: 1.0,
            delay: 0.4 + i * 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="proceso"
      ref={sectionRef}
      className="relative bg-black section-padding overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-12 lg:mb-20">
          <h2 className="process-title font-cinzel text-amber text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] leading-[1] tracking-[-0.03em] opacity-0">
            {t("title")}
          </h2>
          <p className="process-subtitle font-quattrocento uppercase tracking-[0.05em] text-aluminum-dark text-sm sm:text-base mt-4 opacity-0">
            {t("subtitle")}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {stages.map((stage, i) => (
            <div
              key={i}
              className="process-card bg-[#111111] rounded-2xl overflow-hidden group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,191,0,0.15)] transition-all duration-500 opacity-0"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={stage.image}
                  alt={stage.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-4 lg:p-6">
                <span className="font-quattrocento text-amber text-xs uppercase tracking-[0.1em]">
                  {stage.stage}
                </span>
                <h3 className="font-cinzel text-aluminum text-lg sm:text-xl lg:text-2xl font-bold mt-2 mb-4">
                  {stage.title}
                </h3>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-aluminum-dark">
                    <Clock size={14} />
                    <span className="font-quattrocento text-xs">{stage.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-aluminum-dark">
                    <Thermometer size={14} />
                    <span className="font-quattrocento text-xs">{stage.temp}</span>
                  </div>
                </div>

                <p className="font-quattrocento text-aluminum-dark text-sm leading-[1.5]">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
