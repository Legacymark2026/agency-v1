export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  companyLogoText: string;
  metric: string;
  metricLabel: string;
}

export const testimonialsData: Testimonial[] = [
  {
    id: "test-1",
    quote:
      "NEOGESTIÓN transformó integralmente nuestra toma de decisiones operativas. Su acompañamiento directivo no se quedó en reportes; trabajaron junto a nosotros hasta ver reflejado el incremento en el margen bruto.",
    author: "Ing. Mauricio Benítez",
    role: "Director General de Operaciones",
    company: "Grupo Industrial Continental",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    companyLogoText: "CONTINENTAL GROUP",
    metric: "+34.5%",
    metricLabel: "Incremento en Eficiencia Operativa",
  },
  {
    id: "test-2",
    quote:
      "La modernización hacia la nube y la arquitectura de inteligencia de negocios nos permitió anticipar la demanda de clientes y reducir costes de TI con una velocidad sin precedentes.",
    author: "Lic. Patricia Estrada",
    role: "Chief Technology Officer",
    company: "Financiera NovaBank",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80",
    companyLogoText: "NOVABANK INT.",
    metric: "99.99%",
    metricLabel: "Disponibilidad en Sistemas Críticos",
  },
  {
    id: "test-3",
    quote:
      "La rigurosidad en ciberseguridad y gobierno de datos de NEOGESTIÓN nos otorgó la certificación ISO 27001 en tiempo récord, blindando contratos clave con corporaciones globales.",
    author: "Dr. Andrés Salazar",
    role: "Presidente del Consejo",
    company: "Soluciones Logísticas Globales",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
    companyLogoText: "LOGÍSTICA GLOBAL",
    metric: "0 Brechas",
    metricLabel: "Auditoría de Cumplimiento Impecable",
  },
];
