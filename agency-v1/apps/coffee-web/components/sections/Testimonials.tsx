"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

interface TestimonialItem {
  text: string;
  name: string;
  role: string;
}

const Testimonials = () => {
  const t = useTranslations("testimonials");
  const sectionRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  const rawList = t.raw("list") as Array<{ text: string; name: string; role: string }>;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const title = sectionRef.current!.querySelector(".test-title");
      const cards = sectionRef.current!.querySelectorAll(".test-card");

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: title, start: "top 85%", once: true },
          }
        );
      }

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8,
            delay: 0.2 + i * 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%", once: true },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [visibleCount]);

  const maxSlide = Math.max(0, rawList.length - visibleCount);

  const next = () => setCurrent((prev) => Math.min(prev + 1, maxSlide));
  const prev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  return (
    <section
      id="testimonios"
      ref={sectionRef}
      className="relative bg-aluminum dot-pattern-light section-padding"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <h2 className="test-title font-cinzel text-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center mb-12 lg:mb-20 opacity-0">
          {t("title")}
        </h2>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prev}
            disabled={current === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-6 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black flex items-center justify-center text-amber hover:bg-amber hover:text-black transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={next}
            disabled={current >= maxSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-6 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black flex items-center justify-center text-amber hover:bg-amber hover:text-black transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          {/* Cards Track */}
          <div className="overflow-hidden mx-8 lg:mx-12">
            <div
              className="flex transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${current * (100 / visibleCount)}%)` }}
            >
              {rawList.map((t, i) => (
                <div
                  key={i}
                  className="test-card flex-shrink-0 px-2 lg:px-3 opacity-0"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] h-full flex flex-col">
                    {/* Quote */}
                    <span className="font-cinzel text-amber text-5xl lg:text-7xl opacity-20 leading-none">
                      &ldquo;
                    </span>

                    {/* Text */}
                    <p className="font-quattrocento text-black text-sm sm:text-base lg:text-lg leading-[1.7] flex-1 -mt-4">
                      {t.text}
                    </p>

                    {/* Divider */}
                    <div className="w-10 h-[1px] bg-amber my-6 lg:my-8" />

                    {/* Author */}
                    <p className="font-quattrocento font-bold text-black text-sm lg:text-base">
                      {t.name}
                    </p>
                    <p className="font-quattrocento text-aluminum-dark text-xs lg:text-sm">
                      {t.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8 lg:mt-10">
            {Array.from({ length: maxSlide + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors duration-300 cursor-pointer ${
                  i === current ? "bg-amber" : "bg-aluminum-dark"
                }`}
                aria-label={`Ir al slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
