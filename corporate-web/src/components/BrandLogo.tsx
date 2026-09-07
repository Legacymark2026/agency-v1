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
  showCompany = true,
  clickable = true,
  className = "",
}: BrandLogoProps) {
  const isBlueBg = variant === "dark" || variant === "blue-bg";

  // Dimensiones proporcionales basadas en la relación de aspecto 820x312 (ratio 2.628)
  // '2xl' duplica el tamaño visual original para cumplir con la presencia directiva solicitada
  const dimensions = {
    sm: { width: 130, height: 50, company: "text-[9px] tracking-[0.16em]" },
    md: { width: 190, height: 72, company: "text-[10px] tracking-[0.18em]" },
    lg: { width: 240, height: 91, company: "text-[11px] tracking-[0.2em]" },
    xl: { width: 280, height: 106, company: "text-[12px] tracking-[0.22em]" },
    "2xl": { width: 310, height: 118, company: "text-[12.5px] tracking-[0.24em]" },
    "3xl": { width: 380, height: 145, company: "text-[14px] tracking-[0.26em]" },
  }[size] || { width: 310, height: 118, company: "text-[12.5px] tracking-[0.24em]" };

  // Selección del SVG oficial según la variante de fondo:
  // - Para fondos AZULES (variant === "dark" | "blue-bg"):
  //   Se utiliza estrictamente Mesa de trabajo 9 copia 6.svg (/brand/logo-neogestion-white-gold.svg)
  //   con tipografía blanca y acentos dorados para que contraste perfecto y no se pierda en el fondo azul.
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
    <div className={`inline-flex flex-col justify-center group ${className}`}>
      <div className="relative flex items-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
        <Image
          src={logoSrc}
          alt="NeoGESTIÓN software - Consultoría de Colombia SAS"
          width={dimensions.width}
          height={dimensions.height}
          className="w-auto h-auto max-h-[58px] sm:max-h-[68px] md:max-h-[76px] lg:max-h-[82px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
      </div>

      {showCompany && (
        <span
          className={`font-helvetica-thin ${dimensions.company} uppercase font-medium mt-1 pl-1 select-none ${
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
