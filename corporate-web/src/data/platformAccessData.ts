export interface CorporateAccessItem {
  id: string;
  companyName: string;
  sector: string;
  badge: string;
  description: string;
  loginUrl: string;
  displayUrl: string;
  logoSrc?: string;
  initials: string;
  accentColor: string;
  dedicatedInstance: boolean;
  status: "active" | "maintenance";
}

export const platformAccessData = {
  mainPlatform: {
    title: "NeoGestión - SIG (Software ISO 9001, 14001, 45001)",
    badge: "Plataforma Principal de Producción",
    subtitle: "Con NeoGestión las organizaciones ahorran tiempo y dinero en las etapas de implementación, capacitación, auditorías internas y mejora continua, obteniendo un Retorno sobre la Inversión (ROI) en un tiempo promedio de un año.",
    url: "https://neogestion.neoinf.com/neogestion2/index.php",
    displayUrl: "neogestion.neoinf.com",
    features: [
      "Software Integral SIG para normas ISO 9001:2015, ISO 14001, ISO 45001",
      "Implementación ágil, capacitación y auditorías internas con trazabilidad",
      "Entorno productivo centralizado para empresas cliente",
      "Retorno de inversión (ROI) comprobado en un tiempo promedio de 1 año"
    ],
    sla: "99.9% Uptime",
    securityTier: "Cifrado SSL / Aislamiento Corporativo",
  },
  corporateAccessList: [
    {
      id: "neocovolco",
      companyName: "Covolco",
      sector: "Cooperativo & Transporte",
      badge: "Instancia Corporativa",
      description: "Portal privado de gestión empresarial, operaciones y control normativo para la cooperativa Covolco.",
      loginUrl: "https://neocovolco.neoinf.com/index.php",
      displayUrl: "neocovolco.neoinf.com",
      initials: "CV",
      accentColor: "#01426F",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "metrolinea",
      companyName: "Metrolínea",
      sector: "Transporte Masivo & Sector Público",
      badge: "Portal Institucional",
      description: "Sistema institucional de gestión, control de procesos y atención al ciudadano para el Sistema Integrado de Transporte Masivo Metrolínea.",
      loginUrl: "https://metrolinea.neoinf.com/publico/index.php",
      displayUrl: "metrolinea.neoinf.com",
      initials: "MT",
      accentColor: "#059669",
      dedicatedInstance: true,
      status: "active" as const,
    },
    {
      id: "siplag",
      companyName: "UNGRD - SIPLAG",
      sector: "Gobierno & Gestión del Riesgo",
      badge: "Instancia Gubernamental",
      description: "Sistema para la Planeación y Gestión del Riesgo (SIPLAG) de la Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD).",
      loginUrl: "https://siplag.gestiondelriesgo.gov.co/",
      displayUrl: "siplag.gestiondelriesgo.gov.co",
      initials: "GR",
      accentColor: "#B08A1A",
      dedicatedInstance: true,
      status: "active" as const,
    }
  ]
};
