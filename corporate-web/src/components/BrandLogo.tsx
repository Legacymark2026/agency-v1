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
    sm: { width: 105, height: 40, company: "text-[7.5px] tracking-[0.14em]" },
    md: { width: 135, height: 51, company: "text-[8.5px] tracking-[0.18em]" },
    lg: { width: 170, height: 65, company: "text-[9.5px] tracking-[0.2em]" },
    xl: { width: 220, height: 84, company: "text-[11px] tracking-[0.22em]" },
  }[size];

  // Selección del SVG oficial según la variante de fondo
  const logoSrc = {
    dark: "/brand/logo-neogestion-white-gold.svg",
    light: "/brand/logo-neogestion-blue-gold.svg",
    gold: "/brand/logo-neogestion-gold.svg",
    white: "/brand/logo-neogestion-white.svg",
  }[variant] || "/brand/logo-neogestion-white-gold.svg";

  const content = (
    <div className={`inline-flex flex-col justify-center group ${className}`}>
      <div className="relative flex items-center">
        <Image
          src={logoSrc}
          alt="NeoGESTIÓN software - Consultoría de Colombia SAS"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
      </div>

      {showCompany && (
        <span
          className={`font-helvetica-thin ${dimensions.company} uppercase font-light mt-0.5 pl-1 select-none ${
            isDark ? "text-slate-300 group-hover:text-[#D4AF37]" : "text-slate-600 group-hover:text-[#01426F]"
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
