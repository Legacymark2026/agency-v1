import Link from "next/link";

export interface BrandLogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showSoftwareTag?: boolean;
  showCompany?: boolean;
  clickable?: boolean;
  className?: string;
}

export default function BrandLogo({
  variant = "dark",
  size = "md",
  showSoftwareTag = true,
  showCompany = true,
  clickable = true,
  className = "",
}: BrandLogoProps) {
  const isDark = variant === "dark";

  // Sizing definitions
  const sizeClasses = {
    sm: {
      box: "w-8 h-8 rounded-lg",
      icon: "w-4 h-4",
      title: "text-lg",
      software: "text-[8px] tracking-[0.4em]",
      company: "text-[7.5px] tracking-[0.14em]",
    },
    md: {
      box: "w-10 h-10 rounded-xl",
      icon: "w-5 h-5",
      title: "text-xl",
      software: "text-[9px] tracking-[0.42em]",
      company: "text-[8.5px] tracking-[0.16em]",
    },
    lg: {
      box: "w-12 h-12 rounded-2xl",
      icon: "w-6 h-6",
      title: "text-2xl sm:text-3xl",
      software: "text-[10px] tracking-[0.45em]",
      company: "text-[9.5px] tracking-[0.18em]",
    },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Isotipo geométrico institucional en Oro #B08A1A y Azul #01426F */}
      <div
        className={`${sizeClasses.box} ${
          isDark
            ? "bg-gradient-to-br from-[#01426F] to-[#002d4d] border border-[#B08A1A]/50 text-[#B08A1A] shadow-md group-hover:border-[#B08A1A]"
            : "bg-white border border-[#B08A1A] text-[#01426F] shadow-sm group-hover:bg-slate-50"
        } flex items-center justify-center transition-all duration-300 shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${sizeClasses.icon} fill-none stroke-current stroke-[2.2]`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>

      {/* Identidad tipográfica según manual oficial */}
      <div className="flex flex-col justify-center">
        {/* Marca: "NeoGESTIÓN" en Magneto Bold */}
        <div className="flex items-baseline leading-none">
          <span
            className={`font-magneto ${sizeClasses.title} ${
              isDark ? "text-white" : "text-[#01426F]"
            } select-none`}
          >
            Neo<span className="text-[#B08A1A]">GESTIÓN</span>
          </span>
        </div>

        {/* Submarca: "s o f t w a r e" en sans-serif humanista con amplio tracking */}
        {showSoftwareTag && (
          <span
            className={`font-software ${sizeClasses.software} ${
              isDark ? "text-[#D4AF37]" : "text-[#B08A1A]"
            } font-medium block mt-0.5 leading-none`}
          >
            software
          </span>
        )}

        {/* Subtítulo institucional: "Consultoría de Colombia SAS" en helvetica35-thin */}
        {showCompany && (
          <span
            className={`font-helvetica-thin ${sizeClasses.company} uppercase font-light mt-1 ${
              isDark ? "text-slate-300" : "text-slate-600"
            } block leading-tight`}
          >
            Consultoría de Colombia SAS
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" aria-label="NeoGESTIÓN software - Inicio">
        {content}
      </Link>
    );
  }

  return content;
}
