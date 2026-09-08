export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  benefits: string[];
  deliverables: string[];
  targetAudience: string;
}

// 1. CONSULTORÍA EMPRESARIAL
export interface ConsultingService {
  title: string;
  description: string;
}

export const consultingServicesList: ConsultingService[] = [
  {
    title: "Fortalecimiento de la capacidad tecnológica",
    description: "Investigación aplicada y transferencia de tecnología en la MIPYME. Desarrollo tecnológico de cadenas productivas y de valor.",
  },
  {
    title: "Ingeniería de procesos productivos",
    description: "Mejoramiento sustancial de procesos y productos. Diseño y desarrollo de nuevos productos. Diseño de prototipos y plantas piloto.",
  },
  {
    title: "Sistemas de información y economías en red",
    description: "Diseño de sistemas de información técnico-económica. Desarrollo de software para procesos gerenciales y de producción. Desarrollo y utilización de sistemas expertos en automatización.",
  },
  {
    title: "Gestión ambiental y producción más limpia",
    description: "Estructuras o sistemas de información tecnológica en aspectos relacionados con gestión ambiental, tecnologías ambientalmente sanas y producción más limpia.",
  },
  {
    title: "Comercio electrónico y tecnologías de información",
    description: "Comercio electrónico, tecnologías de información y comercio en red. Estructuras o sistemas de información sobre mercados nacionales e internacionales. Estrategias de mercadeo y comercialización.",
  },
  {
    title: "Sistemas de calidad",
    description: "Sistemas de calidad en los niveles regional, nacional y sectorial.",
  },
];

// 2. SOFTWARE NEOGESTIÓN - NORMATIVAS QUE CUMPLE
export interface StandardCompliance {
  norm: string;
  description: string;
  category: "calidad" | "sst" | "ambiental" | "seguridad" | "sector_publico" | "inocuidad";
}

export const softwareStandardsList: StandardCompliance[] = [
  {
    norm: "SG-SST",
    description: "Sistema de Gestión de Seguridad y Salud en el Trabajo (Decreto 1443/2014 - Decreto 1072/2015)",
    category: "sst",
  },
  {
    norm: "ISO 9001:2015",
    description: "Sistema de Gestión de Calidad",
    category: "calidad",
  },
  {
    norm: "ISO 14001",
    description: "Sistema de Gestión Ambiental",
    category: "ambiental",
  },
  {
    norm: "OHSAS 18001",
    description: "Sistema de Gestión de Seguridad y Salud Ocupacional",
    category: "sst",
  },
  {
    norm: "ISO 13485",
    description: "Sistema de Gestión de Calidad - Requisitos para Dispositivos Médicos",
    category: "calidad",
  },
  {
    norm: "ISO 22000",
    description: "Sistema de Gestión de Inocuidad de los Alimentos",
    category: "inocuidad",
  },
  {
    norm: "ISO/IEC 27001",
    description: "Sistema de Gestión de Seguridad de la Información",
    category: "seguridad",
  },
  {
    norm: "ISO 28000",
    description: "Sistema de Gestión de la Seguridad para la Cadena de Suministro",
    category: "seguridad",
  },
  {
    norm: "ISO 23301",
    description: "Sistema de Gestión de la Continuidad del Negocio",
    category: "calidad",
  },
  {
    norm: "ISO 26000",
    description: "Sistema de Gestión de Responsabilidad Social",
    category: "calidad",
  },
  {
    norm: "NTCGP 1000",
    description: "Norma Técnica de Calidad para el Sector Público",
    category: "sector_publico",
  },
  {
    norm: "MECI",
    description: "Modelo Estándar de Control Interno",
    category: "sector_publico",
  },
  {
    norm: "BASC",
    description: "Business Alliance for Secure Commerce (Comercio Seguro)",
    category: "seguridad",
  },
  {
    norm: "HACCP",
    description: "Hazard Analysis and Critical Control Points (Análisis de Peligros y Puntos Críticos de Control)",
    category: "inocuidad",
  },
  {
    norm: "Buenas Prácticas de Manufactura (BPM)",
    description: "Estándares y protocolos de manufactura higiénica y de procesos",
    category: "inocuidad",
  },
];

// 2. SOFTWARE NEOGESTIÓN - MÓDULOS DE GESTIÓN
export interface ManagementModuleItem {
  id: string;
  name: string;
  function: string;
  iconName: string;
}

export const softwareModulesList: ManagementModuleItem[] = [
  {
    id: "documental",
    name: "Gestión Documental",
    function: "Administración y control de toda la documentación interna y externa con filosofía Cero Papel y tablas de retención.",
    iconName: "Workflow",
  },
  {
    id: "gerencial",
    name: "Gestión Gerencial",
    function: "Herramientas para la alta dirección, toma de decisiones estratégicas, planes de trabajo y presupuestos.",
    iconName: "TrendingUp",
  },
  {
    id: "mejora-continua",
    name: "Gestión de la Mejora Continua",
    function: "Seguimiento riguroso de acciones correctivas, preventivas y planes de mejora continua demostrable.",
    iconName: "ShieldCheck",
  },
  {
    id: "recursos-humanos",
    name: "Gestión de Recursos Humanos",
    function: "Administración de personal, perfiles de cargo, funciones, competencias, evaluaciones de desempeño y programas de inducción.",
    iconName: "Users2",
  },
  {
    id: "crm",
    name: "Gestión Comercial (CRM)",
    function: "Administración de clientes, relaciones comerciales, seguimiento de oportunidades y satisfacción del cliente.",
    iconName: "Network",
  },
  {
    id: "compras",
    name: "Gestión de Compras",
    function: "Selección, evaluación y reevaluación de proveedores calificados, trazabilidad de órdenes de compra y suministros.",
    iconName: "ShoppingBag",
  },
  {
    id: "sg-sst",
    name: "Gestión de Seguridad y Salud en el Trabajo (SG-SST)",
    function: "Gestión integral de identificación de peligros, riesgos, control de accidentes y enfermedades laborales según Decreto 1072/2015.",
    iconName: "ShieldAlert",
  },
  {
    id: "proyectos",
    name: "Gestión de Proyectos",
    function: "Planificación, asignación de recursos, seguimiento de hitos, cronogramas y control de proyectos en tiempo real.",
    iconName: "Layers",
  },
  {
    id: "comunicacion-interna",
    name: "Gestión de la Comunicación Interna",
    function: "Comunicación efectiva, circularización institucional y trazabilidad transparente entre todos los niveles de la organización.",
    iconName: "MessageSquare",
  },
];

// 2. SOFTWARE NEOGESTIÓN - FUNCIONALIDADES CLAVE
export const softwareKeyFeaturesList: string[] = [
  "Identificación de peligros, evaluación y valoración de riesgos (GTC 45)",
  "Establecimiento de medidas de prevención y control jerarquizado",
  "Matriz Legal automatizada para control y cumplimiento normativo permanente",
  "Gestión de Políticas y objetivos SST con despliegue a toda la organización",
  "Administración de actas de comités (COPASST, Revisión por la Dirección, Convivencia Laboral)",
  "Programa General de Capacitación con evaluación de eficacia y cobertura",
  "Auditorías internas con metodología ISO 19011:2012 y registro de hallazgos",
  "Gestión de accidentalidad con indicadores cuantitativos (Frecuencia, Severidad, I.I.I.)",
  "Revisión por la Dirección con seguimiento automático de compromisos",
  "Comunicación y trazabilidad en tiempo real con todos los stakeholders",
  "Control estricto de documentación interna y externa con firmas digitales",
];

// 3. CAPACITACIÓN Y FORMACIÓN
export interface TrainingService {
  title: string;
  description: string;
}

export const trainingServicesList: TrainingService[] = [
  {
    title: "Entrenamiento en nuevas tecnologías",
    description: "Programas de entrenamiento en nuevas tecnologías y en gestión tecnológica para líderes y equipos técnicos.",
  },
  {
    title: "Transferencia tecnológica hacia MIPYMES",
    description: "Programas de asistencia técnica que impliquen transferencia de tecnología, a través del aprendizaje y la apropiación de la tecnología.",
  },
  {
    title: "Investigación tecnológica aplicada",
    description: "Preparación en la investigación tecnológica aplicada al dominio de tecnologías competitivas e industriales.",
  },
  {
    title: "Capacitación en tecnologías ambientales",
    description: "Capacitación en tecnologías ambientales sanas, gestión ecológica y su transferencia hacia procesos productivos.",
  },
  {
    title: "Entrenamiento en tecnologías de la información",
    description: "Entrenamiento en tecnologías de la información, comercio electrónico, digitalización de flujos y afines.",
  },
  {
    title: "Gestión de la calidad",
    description: "Programas de entrenamiento en gestión de la calidad, formación de auditores internos y metodologías de mejora.",
  },
];

// 4. ASISTENCIA TÉCNICA
export interface TechnicalAssistanceItem {
  title: string;
  description: string;
}

export const technicalAssistanceList: TechnicalAssistanceItem[] = [
  {
    title: "Diseño e implementación de estrategia de diferenciación",
    description: "Asesoría estratégica para consolidar una diferenciación competitiva y sostenible en el mercado.",
  },
  {
    title: "Implementación del Balanced Scorecard (BSC)",
    description: "Asistencia para la estructuración del cuadro de mando integral, metas financieras, operativas y de clientes.",
  },
  {
    title: "Asistencia técnica en gestión de la calidad",
    description: "Acompañamiento integral en la implementación, transición y mejora continua de sistemas de calidad.",
  },
  {
    title: "Asistencia técnica ambiental",
    description: "Acompañamiento en temas de gestión ambiental, huella ecológica y cumplimiento de la norma ISO 14001.",
  },
  {
    title: "Mejoramiento de procesos productivos y de gestión",
    description: "Optimización de procesos operativos y administrativos eliminando sobrecostos e ineficiencias.",
  },
  {
    title: "Implementación de sistemas/técnicas de mejoramiento",
    description: "Reingeniería, Justo a Tiempo (JIT), Calidad Total, 5S, Kaizen, equipos de mejora continua y gestión integral.",
  },
  {
    title: "Mejoramiento de la competitividad y productividad",
    description: "Asesoría focalizada para aumentar los índices de competitividad, rendimiento y valor agregado.",
  },
  {
    title: "Unidades y programas de asistencia técnica y desarrollo empresarial",
    description: "Programas de apoyo estructurado al desarrollo y escalabilidad empresarial.",
  },
  {
    title: "Gestión de esquemas de logística",
    description: "Asesoría especializada en logística, cadena de suministro, distribución y almacenamiento seguro.",
  },
  {
    title: "Diseño y adopción de modelos integrales de gestión basados en el conocimiento",
    description: "Implementación de modelos avanzados de gestión del conocimiento y capital intelectual organizacional.",
  },
  {
    title: "Referenciación competitiva (Benchmarking)",
    description: "Prácticas de mejoramiento continuo y diagnóstico basadas en benchmarking con líderes de la industria.",
  },
];

// 5. MODELOS DE NEGOCIO (LICENCIAMIENTO)
export interface BusinessModel {
  code: string;
  name: string;
  badge: string;
  description: string;
  highlights: string[];
}

export const licensingModelsList: BusinessModel[] = [
  {
    code: "LUV",
    name: "Licencia de Uso Vitalicia",
    badge: "Activo Patrimonial Perpetuo",
    description: "Licencia perpetua para uso del software instalable en servidores propios de la organización con soberanía total de datos.",
    highlights: [
      "Propiedad perpetua del activo de software",
      "Instalación en la infraestructura privada de la empresa",
      "Usuarios ilimitados sin pagos recurrentes de licenciamiento",
      "Soberanía y control absoluto sobre las bases de datos",
    ],
  },
  {
    code: "SAAS",
    name: "Servicio Cloud Computing / SAAS",
    badge: "Agilidad & Disponibilidad 24/7",
    description: "Servicio en la nube (Software as a Service) con acceso seguro vía Internet, backups diarios automáticos y monitoreo continuo.",
    highlights: [
      "Cero inversión en servidores físicos o infraestructura local",
      "Acceso seguro en línea y en tiempo real desde cualquier dispositivo",
      "Respaldos diarios automatizados y mantenimiento incluido",
      "Actualizaciones continuas y soporte técnico especializado",
    ],
  },
  {
    code: "LUVI",
    name: "Licencia de Uso Vitalicia Multiempresas",
    badge: "Grupos Empresariales & Holdings",
    description: "Licencia perpetua para múltiples empresas o filiales de un mismo grupo corporativo, centralizando la gobernanza.",
    highlights: [
      "Gestión multisede y multiempresa desde un mismo ecosistema",
      "Consolidación de auditorías e indicadores corporativos",
      "Economía de escala para grupos económicos y corporativos",
      "Propiedad vitalicia y parametrización independiente por empresa",
    ],
  },
];

// SERVICIOS PRINCIPALES (Compatibilidad con el portal y vistas destacadas)
export const servicesData: ServiceItem[] = [
  {
    id: "consultoria",
    slug: "consultoria-empresarial-especializada",
    title: "1. Consultoría Empresarial Especializada",
    shortDescription: "Servicios profesionales especializados de asesoría y consultoría para el fortalecimiento tecnológico y mejoramiento organizacional.",
    fullDescription: "Consultoría de Colombia S.A.S. brinda servicios profesionales especializados de asesoría y consultoría empresarial para fortalecer la capacidad tecnológica, ingeniería de procesos productivos, economías en red, gestión ambiental, comercio electrónico y sistemas de calidad.",
    iconName: "ShieldCheck",
    benefits: [
      "Mejoramiento organizacional, regional y nacional comprobable",
      "Fortalecimiento de la capacidad tecnológica y transferencia hacia MIPYMES",
      "Ingeniería de procesos productivos, diseño de prototipos y plantas piloto",
      "Estructuración de sistemas de calidad y producción más limpia",
    ],
    deliverables: [
      "Diagnóstico Tecnológico y Productivo",
      "Plan Maestro de Mejoramiento Sustancial de Procesos",
      "Diseño de Sistemas de Información Técnico-Económica",
      "Estrategias de Mercadeo y Comercialización en Red",
    ],
    targetAudience: "Comités Directivos, Gerencias Generales, Directores de Operaciones y Líderes de Calidad.",
  },
  {
    id: "software",
    slug: "plataforma-tecnologica-neogestion",
    title: "2. Software NeoGestión (Plataforma TIC)",
    shortDescription: "Plataforma tecnológica que integra todos los sistemas de gestión en una sola herramienta interactiva y colaborativa basada en TIC's.",
    fullDescription: "NeoGestión es la solución tecnológica integral que centraliza 15 sistemas de gestión (ISO 9001, SG-SST Decreto 1072, ISO 14001, BASC, HACCP, ISO 27001, NTCGP 1000, MECI) a través de 9 módulos operativos y 11 funcionalidades críticas con filosofía Cero Papel.",
    iconName: "Cpu",
    benefits: [
      "Gestión inmediata, en línea y en tiempo real con usuarios ilimitados",
      "Cumplimiento simultáneo de más de 15 normativas nacionales e internacionales",
      "Eliminación radical del papel y de trámites administrativos innecesarios",
      "Interconexión fluida entre colaboradores, clientes, proveedores y stakeholders",
    ],
    deliverables: [
      "9 Módulos de Gestión (Documental, Gerencial, SST, RRHH, CRM, Compras, etc.)",
      "Matriz Legal Automatizada y Matriz de Riesgos y Peligros",
      "Gestor de Auditorías Internas (ISO 19011) y Reportes de Accidentalidad",
      "Portal y Tableros Directivos de Indicadores en Tiempo Real",
    ],
    targetAudience: "Líderes HSEQ, Directores de Gestión Integral, Gerencias de Operaciones y Oficiales de Cumplimiento.",
  },
  {
    id: "capacitacion",
    slug: "capacitacion-y-formacion-tecnologica",
    title: "3. Capacitación y Formación Especializada",
    shortDescription: "Programas de entrenamiento en nuevas tecnologías, transferencia hacia MIPYMES, investigación tecnológica aplicada y calidad.",
    fullDescription: "Diseñamos y ejecutamos programas de formación de alto nivel para impulsar la apropiación tecnológica, capacitación en tecnologías ambientales sanas, entrenamiento en tecnologías de la información, comercio electrónico y gestión integral de la calidad.",
    iconName: "Users2",
    benefits: [
      "Apropiación real de nuevas tecnologías y herramientas TIC",
      "Transferencia de conocimiento técnico hacia equipos de trabajo y MIPYMES",
      "Formación de auditores líderes y equipos de mejora continua",
      "Cultura corporativa orientada a la sostenibilidad y eficiencia",
    ],
    deliverables: [
      "Programas de Entrenamiento en Gestión Tecnológica",
      "Talleres Prácticos de Investigación Tecnológica Aplicada",
      "Módulos de Formación en Tecnologías Ambientales y Calidad",
      "Certificación de Competencias del Talento Humano",
    ],
    targetAudience: "Directores de Talento Humano, Jefes de Capacitación, Mandos Medios y Equipos Técnicos.",
  },
  {
    id: "asistencia-tecnica",
    slug: "asistencia-tecnica-empresarial",
    title: "4. Asistencia Técnica & Mejoramiento Continuo",
    shortDescription: "Acompañamiento experto en Balanced Scorecard, 5S, Kaizen, Calidad Total, esquemas de logística y benchmarking.",
    fullDescription: "Acompañamos a las organizaciones en el diseño e implementación de estrategias de diferenciación, Cuadro de Mando Integral (BSC), optimización de procesos mediante Reingeniería, Justo a Tiempo, Calidad Total, 5S, Kaizen y gestión del conocimiento.",
    iconName: "Workflow",
    benefits: [
      "Incremento directo en la competitividad y productividad empresarial",
      "Implementación efectiva del Balanced Scorecard (BSC)",
      "Adopción de técnicas japonesas de manufactura y gestión (5S, Kaizen, JIT)",
      "Optimización de esquemas logísticos y cadena de suministro",
    ],
    deliverables: [
      "Diseño de Estrategia de Diferenciación Competitiva",
      "Tablero de Control Balanced Scorecard (BSC)",
      "Planes de Intervención en Planta (5S, Kaizen, Reingeniería)",
      "Estudios de Referenciación Competitiva (Benchmarking)",
    ],
    targetAudience: "Gerencias Generales, Directores de Planta, Jefes de Producción y Líderes de Logística.",
  },
  {
    id: "modelos-negocio",
    slug: "modelos-de-negocio-licenciamiento",
    title: "5. Modelos de Negocio Flexibles (LUV, SAAS, LUVI)",
    shortDescription: "Opciones de adquisición transparentes: Licencia de Uso Vitalicia (LUV), Servicio Cloud SAAS o Licencia Multiempresa (LUVI).",
    fullDescription: "Modelos comerciales adaptables a la estructura patrimonial de su empresa. Adquiera la propiedad definitiva del software con Licencia de Uso Vitalicia (LUV/LUVI) o disfrute de la flexibilidad y alta disponibilidad de nuestro Servicio Cloud Computing (SAAS).",
    iconName: "BarChart3",
    benefits: [
      "Flexibilidad total entre adquisición perpetua o servicio en la nube",
      "Usuarios ilimitados sin cobros sorpresivos por cada cuenta nueva",
      "Modalidad LUVI para holdings y grupos empresariales multisede",
      "Acompañamiento consultivo y asistencia técnica garantizada",
    ],
    deliverables: [
      "Contrato de Licencia de Uso Vitalicia (LUV) o Suscripción Cloud SAAS",
      "Acuerdo de Nivel de Servicio (SLA) y Continuidad Operativa",
      "Configuración de Servidor Dedicado o Instancia en la Nube",
      "Capacitación Inicial y Puesta en Marcha Integral",
    ],
    targetAudience: "Juntas Directivas, Gerencias Generales, Directores Financieros (CFO) y CIOs.",
  },
];

export const corporateProcess = [
  {
    step: "01",
    title: "Planear",
    description: "Definición de objetivos estratégicos, mapeo de procesos, matrices de riesgos y asignación de responsabilidades en la plataforma.",
  },
  {
    step: "02",
    title: "Gestionar",
    description: "Ejecución operativa diaria, radicación documental cero papel y seguimiento en tiempo real con usuarios ilimitados.",
  },
  {
    step: "03",
    title: "Controlar",
    description: "Supervisión automatizada de normativas (ISO, SG-SST, SARLAFT, BASC), estados de auditoría y alertas preventivas.",
  },
  {
    step: "04",
    title: "Evaluar",
    description: "Medición cuantitativa de desempeño, evaluación de personas, indicadores de productividad y mejora continua demostrable.",
  },
];
