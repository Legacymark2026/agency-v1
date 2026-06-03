"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import History from "@/components/sections/History";
import Origin from "@/components/sections/Origin";
import Products from "@/components/sections/Products";
import Process from "@/components/sections/Process";
import Experience from "@/components/sections/Experience";
import Gallery from "@/components/sections/Gallery";
import Testimonials from "@/components/sections/Testimonials";
import Newsletter from "@/components/sections/Newsletter";
import Footer from "@/components/sections/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function MarketingPage() {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      gsap.globalTimeline.timeScale(0);
      ScrollTrigger.defaults({ animation: undefined });
    }

    // Refresh ScrollTrigger on load
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative">
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber focus:text-black focus:px-6 focus:py-3 focus:font-bold focus:text-sm focus:uppercase"
      >
        Saltar al contenido
      </a>

      <Header />
      <main>
        <Hero />
        <History />
        <Origin />
        <Products />
        <Process />
        <Experience />
        <Gallery />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
