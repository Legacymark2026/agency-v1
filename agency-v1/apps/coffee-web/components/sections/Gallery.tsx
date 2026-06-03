"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

interface GalleryItem {
  src: string;
  label: string;
}

const Gallery = () => {
  const t = useTranslations("gallery");
  const sectionRef = useRef<HTMLElement>(null);

  const imagesPaths = [
    "/images/gallery-1.jpg",
    "/images/gallery-2.jpg",
    "/images/gallery-3.jpg",
    "/images/gallery-4.jpg",
  ];

  const rawLabels = t.raw("images") as Array<{ label: string }>;
  const galleryImages: GalleryItem[] = rawLabels.map((item, index) => ({
    src: imagesPaths[index] || "/images/gallery-1.jpg",
    label: item.label,
  }));

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const title = sectionRef.current!.querySelector(".gallery-title");
      const subtitle = sectionRef.current!.querySelector(".gallery-subtitle");
      const items = sectionRef.current!.querySelectorAll(".gallery-item");
      const masks = sectionRef.current!.querySelectorAll(".gallery-mask");
      const texts = sectionRef.current!.querySelectorAll(".gallery-text");

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

      if (subtitle) {
        gsap.fromTo(
          subtitle,
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power3.out",
            scrollTrigger: { trigger: subtitle, start: "top 85%", once: true },
          }
        );
      }

      // Scale images
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1, opacity: 1, duration: 1.0, ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 85%", once: true },
          }
        );
      });

      // Reveal masks (slide away)
      masks.forEach((mask) => {
        gsap.fromTo(
          mask,
          { x: "0%" },
          {
            x: "101%", duration: 1.0, ease: "power3.inOut",
            scrollTrigger: { trigger: mask.parentElement, start: "top 75%", once: true },
          }
        );
      });

      // Text slides in
      texts.forEach((text, i) => {
        gsap.fromTo(
          text,
          { x: -40, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.8,
            delay: 0.3 + i * 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: text.parentElement, start: "top 75%", once: true },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="galeria"
      ref={sectionRef}
      className="relative bg-black section-padding"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-20">
          <h2 className="gallery-title font-cinzel text-amber text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] leading-[1] tracking-[-0.03em] opacity-0">
            {t("title")}
          </h2>
          <p className="gallery-subtitle font-quattrocento text-aluminum-dark text-base sm:text-lg md:text-xl mt-4 opacity-0">
            {t("subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className="gallery-item relative rounded-2xl overflow-hidden aspect-[16/10] group opacity-0"
            >
              {/* Mask for reveal effect */}
              <div className="gallery-mask absolute inset-0 bg-black z-10 will-change-transform" />

              {/* Image */}
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />

              {/* Text overlay */}
              <div className="gallery-text absolute bottom-0 left-0 p-4 lg:p-6 z-20 opacity-0">
                <span className="font-quattrocento uppercase tracking-[0.1em] text-amber text-xs sm:text-sm bg-black/60 px-3 py-1.5 rounded">
                  {img.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
