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
      "NEOGESTIÓN transformó integralmente nuestra toma de decisiones operativas y de flota. Su acompañamiento directivo no se quedó en reportes; trabajaron junto a nosotros hasta ver reflejado el incremento en la eficiencia del servicio.",
    author: "Ing. Mauricio Benítez",
    role: "Director General de Operaciones",
    company: "Transpiedecuesta S.A.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    companyLogoText: "TRANSPIEDECUESTA S.A.",
    metric: "+34.5%",
    metricLabel: "Incremento en Eficiencia Operativa",
  },
  {
    id: "test-2",
    quote:
      "La modernización hacia la nube y la arquitectura de gestión en tiempo real nos permitió anticipar las necesidades logísticas y optimizar nuestros procesos con una agilidad sin precedentes.",
    author: "Lic. Patricia Estrada",
    role: "Dirección de Operaciones & TI",
    company: "Covolco",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80",
    companyLogoText: "COVOLCO",
    metric: "99.99%",
    metricLabel: "Disponibilidad en Sistemas Críticos",
  },
  {
    id: "test-3",
    quote:
      "La rigurosidad en calidad, inocuidad y control de procesos de NEOGESTIÓN nos otorgó el cumplimiento de estándares exigentes en tiempo récord, blindando nuestras auditorías y contratos clave.",
    author: "Dr. Andrés Salazar",
    role: "Gerencia de Planta & Calidad",
    company: "Precocidos del Oriente",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
    companyLogoText: "PRECOCIDOS DEL ORIENTE",
    metric: "100%",
    metricLabel: "Cumplimiento en Auditorías de Calidad",
  },
];
