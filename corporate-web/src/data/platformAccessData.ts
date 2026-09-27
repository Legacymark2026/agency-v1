import { LucideIcon } from "lucide-react";

export interface CorporateAccessItem {
  id: string;
  companyName: string;
  sector: string;
  badge: string;
  description: string;
  loginUrl: string;
  logoSrc?: string;
  initials: string;
  accentColor: string;
  dedicatedInstance: boolean;
  status: "active" | "maintenance";
}

export const platformAccessData = {
  mainPlatform: {
    title: "Plataforma Principal Multi-Empresa",
    badge: "Acceso Universal Estándar",
    subtitle: "Punto de acceso cloud unificado para organizaciones cliente en entorno productivo compartido.",
    url: "https://app.neogestion.io",
    features: [
      "Autenticación segura multi-empresa con cifrado TLS 1.3",
      "Módulos integrados HSEQ, Cero Papel, Gerencia y SG-SST",
      "Acceso ilimitado por roles y usuarios sin costo por colaborador",
      "Sincronización en tiempo real y compatibilidad con app móvil"
    ],
    sla: "99.9% Uptime",
    securityTier: "ISO 27001 / SOC 2 Type II Compliance",
  },
  corporateAccessList: [
    {
      id: "sura-arl",
      companyName: "SURA ARL",
      sector: "Seguros & Riesgos Laborales",
      badge: "Instancia Corporativa",
      description: "Portal privado de gestión y mitigación de riesgos laborales bajo normativas del Ministerio del Trabajo.",
      loginUrl: "https://sura.neogestion.io",
      logoSrc: "/images/clients/sura-arl.png",
      initials: "SR",
      accentColor: "#0033A0",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "axa-colpatria",
      companyName: "AXA Colpatria",
      sector: "Servicios Financieros & Seguros",
      badge: "Instancia Enterprise",
      description: "Entorno dedicado para control de procesos directivos, gobierno corporativo y auditorías de cumplimiento.",
      loginUrl: "https://axacolpatria.neogestion.io",
      logoSrc: "/images/clients/axa-colpatria.png",
      initials: "AX",
      accentColor: "#00008F",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "contraloria-santander",
      companyName: "Contraloría de Santander",
      sector: "Sector Público & Control Fiscal",
      badge: "Instancia Gubernamental",
      description: "Plataforma Cero Papel institucional con radicación electrónica certificada y custodia legal inmutable.",
      loginUrl: "https://contraloria.neogestion.io",
      logoSrc: "/images/clients/contraloria-santander.png",
      initials: "CS",
      accentColor: "#006837",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "precocidos-oriente",
      companyName: "Precocidos del Oriente",
      sector: "Agroalimentario & Manufactura",
      badge: "Instancia Industrial",
      description: "Control de calidad en planta, sistemas integrados de inocuidad y preparación de estándares HACCP.",
      loginUrl: "https://precocidos.neogestion.io",
      logoSrc: "/images/clients/precocidos.png",
      initials: "PO",
      accentColor: "#D97706",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "ayuda-profesional",
      companyName: "Ayuda Profesional",
      sector: "Consultoría & Servicios B2B",
      badge: "Instancia Especial",
      description: "Medición de productividad de colaboradores, asignación de tareas operativas y flujos ágiles.",
      loginUrl: "https://ayudaprofesional.neogestion.io",
      logoSrc: "/images/clients/ayuda-profesional.png",
      initials: "AP",
      accentColor: "#0284C7",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "colegio-comfenalco",
      companyName: "Colegio Comfenalco",
      sector: "Educación & Cooperativo",
      badge: "Instancia Institucional",
      description: "Gestión preventiva institucional de SG-SST, comités COPASST y protocolos de seguridad escolar.",
      loginUrl: "https://comfenalco.neogestion.io",
      logoSrc: "/images/clients/comfenalco.png",
      initials: "CC",
      accentColor: "#1B365D",
      dedicatedInstance: true,
      status: "active" as const,
    }
  ]
};
