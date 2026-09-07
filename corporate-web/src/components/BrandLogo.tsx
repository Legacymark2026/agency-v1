import Image from "next/image";
import Link from "next/link";

export interface BrandLogoProps {
  variant?: "dark" | "light" | "gold" | "white";
  size?: "sm" | "md" | "lg" | "xl";
  showSoftwareTag?: boolean;
  showCompany?: boolean;
  clickable?: boolean;
  className?: string;
}

export default function BrandLogo({
  variant = "dark",
  size = "md",
  showCompany = true,
  clickable = true,
  className = "",
}: BrandLogoProps) {
  const isDark = variant === "dark";

  // Dimensiones proporcionales basadas en la relación 820x312 (ratio: 2.628)
  const dimensions = {
    sm: { width: 110, height: 42, company: "text-[8px] tracking-[0.15em]" },
    md: { width: 150, height: 57, company: "text-[9px] tracking-[0.18em]" },
    lg: { width: 190, height: 72, company: "text-[10px] tracking-[0.2em]" },
    xl: { width: 240, height: 91, company: "text-[12px] tracking-[0.22em]" },
  }[size];

  // Selección del SVG oficial según la variante de fondo
  const logoSrc = {
    dark: "/brand/logo-neogestion-white.svg", // Tipografía y símbolo 100% blanco puro (#FFFFFF) para máxima visibilidad y contraste
    light: "/brand/logo-neogestion-blue-gold.svg",
    gold: "/brand/logo-neogestion-gold.svg",
    white: "/brand/logo-neogestion-white.svg",
  }[variant] || "/brand/logo-neogestion-white.svg";

  const content = (
    <div className={`inline-flex flex-col justify-center group ${className}`}>
      <div className="relative flex items-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
        <Image
          src={logoSrc}
          alt="NeoGESTIÓN software - Consultoría de Colombia SAS"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          priority
        />
      </div>

      {showCompany && (
        <span
          className={`font-helvetica-thin ${dimensions.company} uppercase font-medium mt-1 pl-1 select-none ${
            isDark ? "text-white/95 group-hover:text-[#D4AF37]" : "text-[#01426F] group-hover:text-[#B08A1A]"
          } transition-colors leading-tight`}
        >
          Consultoría de Colombia SAS
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" aria-label="NeoGESTIÓN software - Inicio" className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
