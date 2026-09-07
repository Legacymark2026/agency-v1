import Image from "next/image";
import Link from "next/link";

export interface BrandLogoProps {
  variant?: "dark" | "light" | "gold" | "white" | "blue-bg" | "white-bg";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  showSoftwareTag?: boolean;
  showCompany?: boolean;
  clickable?: boolean;
  className?: string;
  isProductOnly?: boolean;
}

export default function BrandLogo({
  variant = "dark",
  size = "2xl",
  showCompany = false,
  clickable = true,
  className = "",
}: BrandLogoProps) {
  const isBlueBg = variant === "dark" || variant === "blue-bg";

  // Dimensiones duplicadas (2 veces más grande) basadas en el ratio 820x312 (ratio: 2.628)
  const dimensions = {
    sm: { width: 320, height: 122 },
    md: { width: 440, height: 168 },
    lg: { width: 560, height: 212 },
    xl: { width: 680, height: 258 },
    "2xl": { width: 780, height: 296 },
    "3xl": { width: 820, height: 312 },
  }[size] || { width: 780, height: 296 };

  // Selección del SVG oficial según la variante de fondo:
  // - Para fondos AZULES (variant === "dark" | "blue-bg"):
  //   Se utiliza estrictamente Mesa de trabajo 9 copia 6.svg (/brand/logo-neogestion-white-gold.svg)
  //   con tipografía blanca y acentos dorados para que no se pierda en el fondo azul.
  // - Para fondos BLANCOS / CLAROS (variant === "light" | "white-bg"):
  //   Se utiliza Mesa de trabajo 9 copia 4.svg (/brand/logo-neogestion-blue-gold.svg) con tipografía azul.
  const logoSrc = isBlueBg
    ? "/brand/logo-neogestion-white-gold.svg" // Mesa de trabajo 9 copia 6.svg
    : variant === "gold"
    ? "/brand/logo-neogestion-gold.svg"
    : variant === "white"
    ? "/brand/logo-neogestion-white.svg"
    : "/brand/logo-neogestion-blue-gold.svg"; // Mesa de trabajo 9 copia 4.svg

  const content = (
    <div className={`inline-flex items-center justify-center group ${className}`}>
      <div className="relative flex items-center">
        <Image
          src={logoSrc}
          alt="NeoGESTIÓN software"
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto max-h-[120px] sm:max-h-[150px] md:max-h-[180px] lg:max-h-[210px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
      </div>

      {showCompany && (
        <span
          className={`font-helvetica-thin text-[11px] tracking-[0.2em] uppercase font-medium mt-1 pl-1 select-none ${
            isBlueBg ? "text-white/95 group-hover:text-[#D4AF37]" : "text-[#01426F] group-hover:text-[#B08A1A]"
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
