"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const Newsletter = () => {
  const t = useTranslations("newsletter");
  const sectionRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const els = sectionRef.current!.querySelectorAll(".news-animate");
      els.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8,
            delay: i * 0.2,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section
      id="newsletter"
      ref={sectionRef}
      className="relative w-full section-padding"
      style={{
        background: "linear-gradient(180deg, #FFBF00 0%, #000000 60%, #E5E5E5 100%)",
      }}
    >
      <div className="max-w-[600px] mx-auto text-center">
        <h2 className="news-animate font-cinzel text-black text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.1] opacity-0">
          {t("title")}
        </h2>

        <p className="news-animate font-quattrocento text-black text-base sm:text-lg md:text-xl leading-[1.6] mt-6 opacity-0">
          {t("description")}
        </p>

        <form onSubmit={handleSubmit} className="news-animate mt-10 lg:mt-12 opacity-0">
          {!submitted ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder")}
                required
                className="flex-1 bg-transparent border-b-2 border-black text-black font-quattrocento text-base sm:text-lg lg:text-xl py-4 px-0 placeholder-black/50 focus:outline-none focus:border-white transition-colors duration-300"
              />
              <button
                type="submit"
                className="bg-black text-amber font-quattrocento font-bold text-sm uppercase tracking-wider px-6 lg:px-8 py-4 hover:bg-white hover:text-black transition-colors duration-300 whitespace-nowrap cursor-pointer"
              >
                {t("submit")}
              </button>
            </div>
          ) : (
            <div className="bg-black/20 rounded-xl p-6">
              <p className="font-cinzel text-black text-xl">
                {t("success_title")}
              </p>
              <p className="font-quattrocento text-black/80 text-base mt-2">
                {t("success_subtitle")}
              </p>
            </div>
          )}
        </form>

        <p className="news-animate font-quattrocento text-black/70 text-xs mt-6 opacity-0">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
};

export default Newsletter;
