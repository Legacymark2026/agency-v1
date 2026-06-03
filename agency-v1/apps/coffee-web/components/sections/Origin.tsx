"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const Origin = () => {
  const t = useTranslations("origin");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const title = sectionRef.current!.querySelector(".origin-title");
      const sep = sectionRef.current!.querySelector(".origin-sep");
      const desc = sectionRef.current!.querySelector(".origin-desc");

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, scale: 0.9, letterSpacing: "0.2em" },
          {
            opacity: 1,
            scale: 1,
            letterSpacing: "0.05em",
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: { trigger: title, start: "top 80%", once: true },
          }
        );
      }

      if (sep) {
        gsap.fromTo(
          sep,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.4,
            scrollTrigger: { trigger: sep, start: "top 80%", once: true },
          }
        );
      }

      if (desc) {
        gsap.fromTo(
          desc,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.6,
            scrollTrigger: { trigger: desc, start: "top 80%", once: true },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="origen"
      ref={sectionRef}
      className="relative bg-black min-h-[80vh] flex items-center justify-center section-padding"
    >
      <div className="max-w-[1000px] text-center">
        <h2 className="origin-title font-cinzel text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[100px] uppercase tracking-[0.05em] blend-difference leading-[1] opacity-0">
          {t("title")}
        </h2>

        <div className="origin-sep w-[100px] h-[2px] bg-amber mx-auto my-8 lg:my-10 origin-center opacity-0" />

        <p className="origin-desc font-quattrocento text-aluminum text-base sm:text-lg md:text-xl lg:text-2xl leading-[1.7] max-w-[800px] mx-auto opacity-0">
          {t("description")}
        </p>
      </div>
    </section>
  );
};

export default Origin;
