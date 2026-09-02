export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  fullBio: string;
  avatar: string;
  linkedIn: string;
  achievements: string[];
}

export interface CorporateValue {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
}

export const corporateValues: CorporateValue[] = [
  {
    id: "agilidad",
    title: "Agilidad Dinámica",
    subtitle: "Adaptabilidad y optimización de recursos",
    description: "Respondemos y nos adaptamos rápidamente a los cambios del entorno y a las necesidades regulatorias, diseñando soluciones intuitivas que optimizan el tiempo y los recursos de nuestros clientes.",
    gradient: "from-blue-950 to-slate-900",
  },
  {
    id: "precision",
    title: "Precisión e Integridad",
    subtitle: "Exactitud tecnológica, legal y control absoluto",
    description: "Actuamos bajo los más estrictos estándares de exactitud tecnológica y legal. Al igual que los sistemas que ayudamos a implementar (ISO, HSEQ, SARLAFT), cada módulo de nuestra plataforma está diseñado para ofrecer control absoluto y veracidad en los datos.",
    gradient: "from-slate-900 to-amber-950/40",
  },
  {
    id: "innovacion",
    title: "Innovación Conectada",
    subtitle: "Ingeniería de software y experiencia de usuario",
    description: "Fusionamos la robustez de la ingeniería de software con la experiencia de usuario. Buscamos constantemente formas disruptivas de simplificar procesos complejos, manteniendo interconectadas las operaciones con las personas.",
    gradient: "from-blue-900/80 to-slate-950",
  },
  {
    id: "solidez",
    title: "Solidez y Respaldo",
    subtitle: "Firmeza, seguridad y confianza a largo plazo",
    description: "Nos proyectamos con la firmeza y seguridad que las empresas necesitan para delegar el control de sus riesgos y auditorías. Somos un pilar tecnológico robusto y de confianza a largo plazo.",
    gradient: "from-slate-950 to-blue-950",
  },
];

export const teamData: TeamMember[] = [
  {
    id: "carlos-mendoza",
    name: "Carlos Mendoza R.",
    role: "Socio Director General & Estrategia",
    specialty: "M&A, Reestructuración & Finanzas Corporativas",
    bio: "Ex-consultor senior en firmas globales con más de 20 años asesorando juntas directivas en expansión y optimización de capital.",
    fullBio: "Carlos Mendoza cuenta con más de dos décadas liderando procesos de fusión, adquisición y reestructuración estratégica para grupos empresariales en América Latina y Europa. Ha participado en comités directivos de más de 30 corporaciones y es docente invitado en escuelas de negocios de alta dirección.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    linkedIn: "https://linkedin.com",
    achievements: [
      "+$450M en transacciones corporativas asesoradas con éxito",
      "Líder del Comité de Estrategia en NEOGESTIÓN desde su fundación",
      "Especialista certificado en Gobierno Corporativo y Finanzas",
    ],
  },
  {
    id: "elena-valencia",
    name: "Dra. Elena Valencia",
    role: "Socia de Transformación Digital & Cloud",
    specialty: "Arquitectura Empresarial, FinOps & Modernización",
    bio: "Doctora en Ciencias de la Computación con amplia trayectoria liderando la migración digital para el sector financiero y retail.",
    fullBio: "Pionera en adopción de arquitecturas serverless y FinOps en entornos bancarios de alta criticidad. Elena lidera la práctica de modernización técnica en NEOGESTIÓN, garantizando que cada dólar invertido en infraestructura cloud rinda retornos operativos superiores al 35%.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    linkedIn: "https://linkedin.com",
    achievements: [
      "+120 proyectos de migración a la nube con cero tiempo de inactividad",
      "Doctorado Cum Laude en Computación Distribuida",
      "Autora de papers de referencia sobre optimización FinOps",
    ],
  },
  {
    id: "miguel-torres",
    name: "Ing. Miguel Torres B.",
    role: "Director de Inteligencia de Datos & IA",
    specialty: "Big Data, Analítica Predictiva & Automatización",
    bio: "Especialista en monetización de activos de información y diseño de ecosistemas analíticos ejecutivos de alta escala.",
    fullBio: "Miguel ha diseñado plataformas de analítica predictiva y machine learning para operadores logísticos multinacionales y aseguradoras. Su enfoque combina gobernanza de datos rigurosa con modelos que anticipan la fuga de clientes y optimizan precios en tiempo real.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    linkedIn: "https://linkedin.com",
    achievements: [
      "Diseño de algoritmos con impacto superior a $15M en ahorro logístico",
      "Líder en implementación de IA Generativa ética en el entorno corporativo",
      "Certificado en Data Governance y MLOps empresarial",
    ],
  },
  {
    id: "sofia-arismendi",
    name: "Lic. Sofía Arismendi",
    role: "Directora de Ciberseguridad & Compliance",
    specialty: "Gobernanza de Seguridad, ISO 27001 & SOC 2",
    bio: "Auditora líder en normas de seguridad y consultora en gestión de crisis y ciber-resiliencia para corporaciones de clase mundial.",
    fullBio: "Con amplia experiencia en sectores altamente regulados, Sofía lidera las auditorías de vulnerabilidad y la implementación del marco Zero Trust. Su metodología prepara a los comités de riesgos para responder y contener ciberincidentes en cuestión de minutos.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    linkedIn: "https://linkedin.com",
    achievements: [
      "100% de éxito en auditorías de certificación ISO 27001 y SOC 2",
      "Miembro activo de comités internacionales de ciberdefensa",
      "Premio a la Excelencia en Gobernanza de la Información 2023",
    ],
  },
];

export const corporateHistory = [
  {
    year: "2010",
    title: "Fundación de NEOGESTIÓN",
    description: "Nace como firma boutique de consultoría estratégica y financiera, asesorando a las primeras 25 corporaciones líderes en reestructuración y eficiencia.",
  },
  {
    year: "2015",
    title: "Creación de la Unidad Tecnológica",
    description: "Incorporamos la práctica de arquitectura empresarial y modernización cloud, guiando las primeras migraciones a gran escala.",
  },
  {
    year: "2020",
    title: "Consolidación Internacional & Ciberdefensa",
    description: "Extendemos operaciones a 5 países y establecemos la división especializada en gobierno de datos, privacidad y ciberseguridad.",
  },
  {
    year: "2025",
    title: "Liderazgo en Eficiencia Estratégica e IA",
    description: "Superamos los 480 proyectos completados, integrando analítica predictiva y automatización en el 90% de las corporaciones clientes.",
  },
];
