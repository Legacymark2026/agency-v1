"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const t = useTranslations("footer");
  const tHeader = useTranslations("header");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const els = sectionRef.current!.querySelectorAll(".footer-animate");
      els.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.6,
            delay: i * 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 95%", once: true },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer
      id="footer"
      ref={sectionRef}
      className="relative bg-black pt-16 sm:pt-20 pb-8 sm:pb-10 px-6 sm:px-10 lg:px-20"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          {/* Logo Column */}
          <div className="footer-animate opacity-0">
            <a href="#hero" onClick={(e) => handleNavClick(e, "#hero")} className="inline-block">
              <img src="/images/logo.png" alt="Goldneez Logo" className="h-12 w-auto object-contain" />
            </a>
            <p className="font-quattrocento text-aluminum-dark text-sm mt-4 leading-[1.7]">
              {t("slogan")}
            </p>
          </div>

          {/* Explore Column */}
          <div className="footer-animate opacity-0">
            <h4 className="font-quattrocento uppercase tracking-[0.1em] text-amber text-xs font-bold mb-6">
              {t("explore_title")}
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: tHeader("home"), href: "#hero" },
                { label: tHeader("products"), href: "#productos" },
                { label: tHeader("process"), href: "#proceso" },
                { label: tHeader("experience"), href: "#experiencia" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="font-quattrocento text-aluminum-dark text-sm hover:text-aluminum transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Products Column */}
          <div className="footer-animate opacity-0">
            <h4 className="font-quattrocento uppercase tracking-[0.1em] text-amber text-xs font-bold mb-6">
              {t("products_title")}
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                "Ethiopia Yirgacheffe",
                "Colombia Huila Supremo",
                "Brasil Cerrado Mineiro",
                "Signature Blend",
              ].map((name) => (
                <span
                  key={name}
                  onClick={() => {
                    const target = document.querySelector("#productos");
                    if (target) target.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="font-quattrocento text-aluminum-dark text-sm hover:text-aluminum transition-colors duration-300 cursor-pointer"
                >
                  {name}
                </span>
              ))}
            </nav>
          </div>

          {/* Contact Column */}
          <div className="footer-animate opacity-0">
            <h4 className="font-quattrocento uppercase tracking-[0.1em] text-amber text-xs font-bold mb-6">
              {t("contact_title")}
            </h4>
            <div className="flex flex-col gap-3 mb-6">
              <p className="font-quattrocento text-aluminum-dark text-sm leading-[1.7]">
                Carrera 18 #79-47, Oficina 201
                <br />
                Bogotá D.C., Colombia
              </p>
              <p className="font-quattrocento text-aluminum-dark text-sm">
                +57 314 562 9141
              </p>
              <p className="font-quattrocento text-aluminum-dark text-sm hover:text-amber transition-colors cursor-pointer">
                hola@goldneez.com
              </p>
              <p className="font-quattrocento text-aluminum-dark text-sm">
                Lun - Vie: 7:00 AM - 8:00 PM
              </p>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-quattrocento uppercase tracking-[0.1em] text-amber text-xs font-bold mb-4">
                {t("follow_title")}
              </h4>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com/goldneez"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aluminum-dark hover:text-amber hover:-translate-y-0.5 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://facebook.com/goldneez"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aluminum-dark hover:text-amber hover:-translate-y-0.5 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://twitter.com/goldneez"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aluminum-dark hover:text-amber hover:-translate-y-0.5 transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-animate border-t border-aluminum-dark/30 mt-12 sm:mt-16 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 opacity-0">
          <p className="font-quattrocento text-aluminum-dark text-xs text-center sm:text-left">
            &copy; 2025 Goldneez. {t("rights")}
          </p>
          <div className="flex gap-4">
            <span className="font-quattrocento text-aluminum-dark text-xs hover:text-aluminum cursor-pointer transition-colors">
              {t("privacy")}
            </span>
            <span className="font-quattrocento text-aluminum-dark text-xs">
              |
            </span>
            <span className="font-quattrocento text-aluminum-dark text-xs hover:text-aluminum cursor-pointer transition-colors">
              {t("terms")}
            </span>
            <span className="font-quattrocento text-aluminum-dark text-xs">
              |
            </span>
            <span
              onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
              className="font-quattrocento text-aluminum-dark text-xs hover:text-aluminum cursor-pointer transition-colors"
            >
              Cookies
            </span>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="footer-animate opacity-0 pt-4 flex justify-center items-center gap-2">
          <span className="font-quattrocento text-aluminum-dark/50 text-xs tracking-widest uppercase">
            Desarrollado por
          </span>
          <a
            href="https://legacymark.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-quattrocento text-amber/70 hover:text-amber text-xs tracking-widest uppercase transition-colors duration-300 hover:underline underline-offset-2"
          >
            LegacyMark BIC S.A.S
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
