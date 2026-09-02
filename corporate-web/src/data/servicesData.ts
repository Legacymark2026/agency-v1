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

export const servicesData: ServiceItem[] = [
  {
    id: "estrategia",
    slug: "consultoria-estrategica",
    title: "Consultoría Estratégica & Directiva",
    shortDescription: "Formulación de planes directivos para acelerar el crecimiento, expandir mercados y maximizar la rentabilidad.",
    fullDescription: "Acompañamos a directores y comités ejecutivos en la toma de decisiones críticas. Analizamos la posición competitiva, diseñamos hojas de ruta plurianuales y alineamos la estructura corporativa con los objetivos financieros y comerciales más exigentes.",
    iconName: "BarChart3",
    benefits: [
      "Incremento sostenido del margen operativo",
      "Claridad y alineación en toda la línea de liderazgo",
      "Mitigación de riesgos en fusiones, adquisiciones y aperturas de mercado",
      "Definición de KPIs e indicadores predictivos de negocio",
    ],
    deliverables: [
      "Plan Estratégico Corporativo 2025-2030",
      "Modelo de Gobierno y Gobernanza Operativa",
      "Tablero de Control de Desempeño Ejecutivo",
    ],
    targetAudience: "Comités de Dirección, CEOs y Juntas Directivas de medianas y grandes empresas.",
  },
  {
    id: "transformacion-digital",
    slug: "transformacion-digital-cloud",
    title: "Transformación Digital & Arquitectura Cloud",
    shortDescription: "Modernización integral de infraestructuras hacia plataformas seguras, ágiles y altamente escalables.",
    fullDescription: "Evolucionamos sistemas tradicionales hacia arquitecturas en la nube modernas. Implementamos ecosistemas tecnológicos que facilitan la innovación continua, la reducción de deuda técnica y la agilidad ante demandas del mercado.",
    iconName: "Cpu",
    benefits: [
      "Reducción de hasta un 40% en costos de infraestructura de TI",
      "Tiempos de despliegue de nuevos productos 3x más veloces",
      "Alta disponibilidad del 99.99% con tolerancia a fallos",
      "Continuidad operativa garantizada y planes de Disaster Recovery",
    ],
    deliverables: [
      "Auditoría y Diagnóstico de Madurez Digital",
      "Arquitectura Cloud Nativa (AWS, Azure o GCP)",
      "Plan de Migración por fases con cero impacto operativo",
    ],
    targetAudience: "CTOs, CIOs y Líderes de Infraestructura Tecnológica.",
  },
  {
    id: "analitica-bi",
    slug: "inteligencia-de-datos-bi",
    title: "Inteligencia de Negocio & Analítica de Datos",
    shortDescription: "Consolidación de activos de información y dashboards ejecutivos para decisiones respaldadas por evidencia.",
    fullDescription: "Convertimos grandes volúmenes de datos dispersos en inteligencia accionable. Diseñamos data warehouses modernos, pipelines automatizados y tableros interactivos para anticipar tendencias de compra, riesgos de inventario y fugas de rentabilidad.",
    iconName: "Network",
    benefits: [
      "Visibilidad 360° del rendimiento de ventas y costos en tiempo real",
      "Modelos predictivos de demanda y retención de clientes",
      "Eliminación de silos de información entre departamentos",
      "Automatización de reportes ejecutivos semanales y mensuales",
    ],
    deliverables: [
      "Arquitectura de Datos Corporativa",
      "Dashboards Ejecutivos en Power BI / Tableau",
      "Algoritmos de Clasificación y Pronóstico de Ventas",
    ],
    targetAudience: "Directores Financieros (CFOs), Directores Comerciales y Gerentes de Operaciones.",
  },
  {
    id: "ciberseguridad",
    slug: "ciberseguridad-y-cumplimiento",
    title: "Ciberseguridad, Riesgo & Cumplimiento",
    shortDescription: "Protección rigurosa de activos críticos y alineación con estándares internacionales (ISO 27001, SOC 2, RGPD).",
    fullDescription: "Implementamos marcos de ciberseguridad 'Zero Trust' para proteger la reputación y los activos digitales más valiosos de su empresa. Realizamos pruebas de penetración, auditorías de vulnerabilidades y capacitaciones preventivas a equipos internos.",
    iconName: "ShieldCheck",
    benefits: [
      "Blindaje integral contra ataques de ransomware y phishing",
      "Cumplimiento formal de regulaciones y estándares exigidos por clientes globales",
      "Respuesta rápida ante incidentes con tiempos de contención mínimos",
      "Protección de la privacidad y confidencialidad de datos de clientes",
    ],
    deliverables: [
      "Evaluación Integral de Riesgos y Brechas de Seguridad",
      "Plan Director de Ciberseguridad y Políticas de Cumplimiento",
      "Protocolo de Respuesta Inmediata ante Incidentes",
    ],
    targetAudience: "CISOs, Gerentes de Riesgo, Oficiales de Cumplimiento Legal y Directores de TI.",
  },
  {
    id: "automatizacion",
    slug: "automatizacion-de-procesos",
    title: "Automatización & Optimización Operativa",
    shortDescription: "Rediseño de flujos de trabajo e implementación de automatizaciones para reducir costos y errores humanos.",
    fullDescription: "Identificamos cuellos de botella en los procesos corporativos e implementamos automatizaciones inteligentes (RPA y workflows basados en IA). Logramos que sus colaboradores se enfoquen en tareas de alto valor estratégico.",
    iconName: "Workflow",
    benefits: [
      "Ahorro de miles de horas hombre anuales en tareas repetitivas",
      "Reducción drástica del error humano en conciliaciones y facturación",
      "Mayor velocidad de atención a clientes y proveedores",
      "Trazabilidad completa y auditoría de cada operación",
    ],
    deliverables: [
      "Mapeo de Procesos Actuales (AS-IS) y Futuros (TO-BE)",
      "Flujos de Automatización Integrados con ERP y CRM",
      "Manuales Operativos y Guías de Monitoreo",
    ],
    targetAudience: "Directores de Operaciones (COOs) y Gerentes de Mejora Continua.",
  },
  {
    id: "talento-liderazgo",
    slug: "desarrollo-de-liderazgo",
    title: "Gestión del Cambio & Liderazgo Ejecutivo",
    shortDescription: "Alineación cultural, capacitación directiva y programas de liderazgo para ejecutar la visión empresarial.",
    fullDescription: "Toda transformación tecnológica fracasa si no se acompaña de una transformación humana. Facilitamos programas de adopción cultural, liderazgo situacional y retención de talento clave para sostener las ventajas competitivas.",
    iconName: "Users2",
    benefits: [
      "Adopción rápida de nuevas tecnologías por parte del personal",
      "Reducción de la rotación en mandos medios y directivos",
      "Cultura orientada a resultados medibles y colaboración ágil",
      "Desarrollo de planes de sucesión sólidos para puestos críticos",
    ],
    deliverables: [
      "Diagnóstico de Clima y Cultura Organizacional",
      "Programa de Coaching y Liderazgo para Directores",
      "Estrategia Integral de Gestión del Cambio",
    ],
    targetAudience: "Directores de Recursos Humanos (CHROs) y Gerentes Generales.",
  },
];

export const corporateProcess = [
  {
    step: "01",
    title: "Diagnóstico & Inmersión",
    description: "Evaluamos en profundidad el estado actual, cuellos de botella, riesgos y metas del negocio mediante entrevistas ejecutivas y análisis de datos.",
  },
  {
    step: "02",
    title: "Diseño Estratégico",
    description: "Formulamos un plan de acción concreto con hitos cuantificables, asignación de responsabilidades y cálculo de retorno de inversión esperado.",
  },
  {
    step: "03",
    title: "Implementación Ágil",
    description: "Ejecutamos las soluciones de forma colaborativa junto a sus equipos internos, minimizando fricciones y asegurando transferencia de conocimiento.",
  },
  {
    step: "04",
    title: "Medición & Optimización",
    description: "Monitoreamos los KPIs establecidos, refinamos los procesos y garantizamos la adopción a largo plazo para asegurar un impacto sostenible.",
  },
];
