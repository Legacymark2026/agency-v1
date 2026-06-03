"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useTranslations } from "next-intl";

const partners = [
  "Colombia Coffee",
  "Rainforest Alliance",
  "Direct Trade",
  "Specialty Coffee",
  "Organic Certified",
  "Fair Trade",
  "Barista Hustle",
  "Coffee Roasters",
];

const Hero = () => {
  const t = useTranslations("hero");
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const counterNumberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Title animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 60, rotateX: 20 },
          { opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: "power3.out" }
        );
      }

      // Subtitle
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.8 }
        );
      }

      // Counter
      if (counterRef.current) {
        gsap.fromTo(
          counterRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: "power3.out", delay: 1.0 }
        );
      }

      // Counter number animation
      if (counterNumberRef.current) {
        gsap.fromTo(
          counterNumberRef.current,
          { innerText: "0" },
          {
            innerText: "50000",
            duration: 2,
            ease: "power2.out",
            snap: { innerText: 1 },
            delay: 1.0,
            onUpdate: function () {
              if (counterNumberRef.current) {
                const val = Math.round(parseFloat(counterNumberRef.current.innerText));
                counterNumberRef.current.innerText = `+${val.toLocaleString()}`;
              }
            },
          }
        );
      }

      // CTA
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 1.4 }
        );
      }

      // Ticker
      if (tickerRef.current) {
        gsap.fromTo(
          tickerRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 1.6 }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleCtaClick = () => {
    const target = document.querySelector("#productos");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden grain-overlay gradient-overlay"
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
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen px-6 sm:px-10 lg:px-20 pt-32 pb-10">
        {/* Top Content */}
        <div className="max-w-[900px]">
          <h1
            ref={titleRef}
            className="font-cinzel text-amber text-4xl sm:text-6xl md:text-7xl lg:text-[100px] xl:text-[120px] leading-[0.9] tracking-[-0.04em] text-shadow-hero opacity-0"
          >
            {t("title1")}
            <br />
            {t("title2")}
            <br />
            {t("title3")}
          </h1>
          <p
            ref={subtitleRef}
            className="font-quattrocento text-aluminum text-base sm:text-lg md:text-xl max-w-[600px] mt-6 text-shadow-sm opacity-0"
          >
            {t("subtitle")}
          </p>
        </div>

        {/* Counter + CTA */}
        <div className="mt-8 lg:mt-0" ref={counterRef}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div>
              <span
                ref={counterNumberRef}
                className="font-cinzel text-amber text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold"
              >
                +0
              </span>
              <p className="font-quattrocento text-aluminum text-sm max-w-[280px] mt-2 text-shadow-sm">
                {t("stats")}
              </p>
            </div>
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[3px] border-amber overflow-hidden animate-pulse-glow flex-shrink-0">
              <img
                src="/images/hero-group.jpg"
                alt="Clientes satisfechos en Goldneez"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <button ref={ctaRef} onClick={handleCtaClick} className="btn-primary opacity-0">
            {t("cta")}
          </button>
        </div>

        {/* Partner Ticker */}
        <div
          ref={tickerRef}
          className="mt-auto pt-8 opacity-0 overflow-hidden bg-black/50 backdrop-blur-sm -mx-6 sm:-mx-10 lg:-mx-20 px-6 sm:px-10 lg:px-20"
        >
          <div className="flex animate-ticker whitespace-nowrap">
            {[...partners, ...partners].map((partner, i) => (
              <span
                key={i}
                className="font-quattrocento text-aluminum/50 text-sm uppercase tracking-wider mx-8 hover:text-aluminum transition-colors duration-300 cursor-default flex-shrink-0"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
