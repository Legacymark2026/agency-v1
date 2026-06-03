"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const History = () => {
  const t = useTranslations("history");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const cards = sectionRef.current!.querySelectorAll(".history-card");
      const textElements = sectionRef.current!.querySelectorAll(".history-text");

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, x: i === 0 ? -60 : 60, rotateY: i === 0 ? -25 : 25 },
          {
            opacity: 1,
            x: 0,
            rotateY: i === 0 ? -15 : 15,
            duration: 1.0,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
          }
        );
      });

      textElements.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.3 + i * 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="historia"
      ref={sectionRef}
      className="relative bg-aluminum dot-pattern-light section-padding overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left Column - Videos */}
          <div className="lg:col-span-3 perspective-1500">
            <div className="relative">
              {/* Main Video Card */}
              <div
                className="history-card relative rounded-2xl overflow-hidden shadow-2xl preserve-3d will-change-transform transition-transform duration-600 hover:scale-[1.02] hover:rotate-y-0"
                style={{ transform: "rotateY(-15deg)", transformStyle: "preserve-3d" }}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video object-cover"
                  aria-hidden="true"
                >
                  <source src="/videos/history-cafe.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 shadow-glow pointer-events-none" />
              </div>

              {/* Secondary Video Card */}
              <div
                className="history-card relative mt-[-40px] ml-[60px] lg:ml-[120px] rounded-2xl overflow-hidden shadow-2xl preserve-3d will-change-transform transition-transform duration-600 hover:scale-[1.02] hover:rotate-y-0 max-w-[80%]"
                style={{ transform: "rotateY(15deg)", transformStyle: "preserve-3d" }}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video object-cover"
                  aria-hidden="true"
                >
                  <source src="/videos/history-roast.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 shadow-glow pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Column - Text */}
          <div className="lg:col-span-2">
            <h2 className="history-text font-cinzel text-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1] tracking-[-0.03em] mb-8 lg:mb-10 opacity-0">
              {t.rich("title", {
                br: () => <br />
              })}
            </h2>
            <p className="history-text font-quattrocento text-black/80 text-base sm:text-lg lg:text-xl leading-[1.7] max-w-[480px] mb-6 opacity-0">
              {t("p1")}
            </p>
            <p className="history-text font-quattrocento text-black/80 text-base sm:text-lg lg:text-xl leading-[1.7] max-w-[480px] mb-8 lg:mb-10 opacity-0">
              {t("p2")}
            </p>

            {/* Slogan */}
            <div className="history-text opacity-0">
              <div className="w-[60px] h-[2px] bg-amber mb-6" />
              <p className="font-cinzel text-amber text-2xl sm:text-3xl lg:text-4xl leading-[1.1]">
                {t.rich("slogan", {
                  br: () => <br />
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default History;
