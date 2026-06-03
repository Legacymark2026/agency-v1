"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const Experience = () => {
  const t = useTranslations("experience");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const title = sectionRef.current!.querySelector(".exp-title");
      const desc = sectionRef.current!.querySelector(".exp-desc");
      const cta = sectionRef.current!.querySelector(".exp-cta");

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, scale: 0.85, y: 40 },
          {
            opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out",
            scrollTrigger: { trigger: title, start: "top 80%", once: true },
          }
        );
      }

      if (desc) {
        gsap.fromTo(
          desc,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power3.out",
            scrollTrigger: { trigger: desc, start: "top 80%", once: true },
          }
        );
      }

      if (cta) {
        gsap.fromTo(
          cta,
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: "power3.out",
            scrollTrigger: { trigger: cta, start: "top 80%", once: true },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="experiencia"
      ref={sectionRef}
      className="relative w-full min-h-[80vh] overflow-hidden grain-overlay"
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        aria-hidden="true"
      >
        <source src="/videos/experience.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85 z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[80vh] section-padding">
        <div className="max-w-[700px] text-center">
          <h2 className="exp-title font-cinzel text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] uppercase tracking-[0.03em] blend-difference leading-[1] opacity-0">
            {t.rich("title", {
              br: () => <br />
            })}
          </h2>

          <p className="exp-desc font-quattrocento text-aluminum text-base sm:text-lg md:text-xl lg:text-2xl leading-[1.7] mt-8 lg:mt-10 text-shadow-sm opacity-0">
            {t("description")}
          </p>

          <div className="exp-cta mt-10 lg:mt-12 opacity-0">
            <button className="btn-secondary">{t("cta")}</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
