import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-between bg-white text-black">
        <HeroSection />
        <Stats />
        <Services />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
