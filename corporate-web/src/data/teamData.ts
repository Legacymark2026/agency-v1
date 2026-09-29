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
    id: "heyber-bohorquez",
    name: "Heyber Enrique Bohórquez Flórez",
    role: "Socio Director General & Estrategia Comercial",
    specialty: "Marketing Estratégico, Negocios Internacionales & Desarrollo Corporativo",
    bio: "Profesional en Marketing y Negocios Internacionales con amplia experiencia liderando procesos de expansión comercial, posicionamiento de marca y estrategia corporativa.",
    fullBio: "Heyber Enrique Bohórquez Flórez es Profesional en Marketing y Negocios Internacionales egresado de las Unidades Tecnológicas de Santander (UTS). Con una sólida trayectoria en dirección comercial, desarrollo de negocios y posicionamiento estratégico de marca, lidera la visión corporativa de NEOGESTIÓN enfocada en la expansión de mercados, alianzas estratégicas y la consolidación de la propuesta de valor del ecosistema tecnológico para organizaciones en Colombia y Latinoamérica.",
    avatar: "/images/heyber-bohorquez.jpeg",
    linkedIn: "https://www.linkedin.com/company/neogestion-software/?originalSubdomain=co",
    achievements: [
      "Profesional en Marketing y Negocios Internacionales — Unidades Tecnológicas de Santander (UTS)",
      "Líder de la estrategia comercial y de expansión de NEOGESTIÓN",
      "Especialista en desarrollo de negocios, alianzas corporativas y posicionamiento de marca",
    ],
  },
  {
    id: "liliana-lizarazo",
    name: "Liliana Lizarazo",
    role: "Directora Administrativa y de Operaciones",
    specialty: "Gestión Organizacional & Optimización de Procesos",
    bio: "Profesional en Administración de Empresas, enfocada en el diseño operativo y la mejora continua de procesos corporativos.",
    fullBio: "Liliana Lizarazo es Profesional en Administración de Empresas y actualmente cursa la carrera de Ingeniería Industrial en la Corporación Universitaria Minuto de Dios (UNIMINUTO). Aporta un enfoque metódico y estructurado a NEOGESTIÓN, liderando la optimización de procesos internos, la gestión de recursos y asegurando la excelencia operativa en la prestación de servicios para nuestros clientes.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    linkedIn: "https://www.linkedin.com/company/neogestion-software/?originalSubdomain=co",
    achievements: [
      "Profesional en Administración de Empresas",
      "Candidata a Ingeniería Industrial — UNIMINUTO",
      "Líder de procesos de mejora continua y gestión administrativa interna",
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
    year: "Génesis",
    title: "Respaldo Consultivo Multidisciplinario",
    description: "Consultoría de Colombia S.A.S., con amplia experiencia en consultoría empresarial y un equipo multidisciplinario en sectores industriales, servicios y sector público, identifica la necesidad de integrar múltiples sistemas de gestión eliminando trámites innecesarios y exceso de papel.",
  },
  {
    year: "TIC & Cero Papel",
    title: "Nacimiento de la Plataforma NeoGestión",
    description: "Nace la plataforma tecnológica sustentada en el uso intensivo de TIC's, permitiendo a las organizaciones gestionar procesos de forma inmediata, en línea y en tiempo real, facilitando la interacción con empleados, clientes, proveedores y stakeholders vía Internet.",
  },
  {
    year: "Multinorma",
    title: "Evolución Modular Documental, Comercial y Operativa",
    description: "Adaptándose a las necesidades dinámicas del mercado, NeoGestión incorpora módulos integrales dando pleno cumplimiento a ISO 9001:2015, ISO 14001, OHSAS 18001, SG-SST (Decreto 1443/2014 - 1072/2015), NTCGP 1000, MECI, BASC, HACCP, ISO 22000, ISO/IEC 27001 e ISO 28000.",
  },
  {
    year: "Presente",
    title: "Solución Integral: Licencia Vitalicia (LUV) & Cloud SaaS",
    description: "NeoGestión se consolida como la solución integral para organizaciones que buscan eficiencia administrativa, cumplimiento normativo y crecimiento competitivo, complementada con consultoría, capacitación, asistencia técnica, Licencia Vitalicia (LUV) y Cloud Computing.",
  },
];
