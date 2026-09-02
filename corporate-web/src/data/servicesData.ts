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
    id: "sistemas-gestion",
    slug: "sistemas-integrados-gestion",
    title: "Sistemas Integrados de Gestión (ISO, SG-SST, HSEQ)",
    shortDescription: "Implementación, auditoría y control de normas internacionales: ISO, SG-SST, HSEQ, SARLAFT, BASC, RUC y HACCP.",
    fullDescription: "NeoGestión simplifica y centraliza la implementación y mantenimiento de Sistemas Integrados de Gestión. Permite cumplir con rigor y dinamismo las normativas ISO (9001, 14001, 27001, 45001), SG-SST, HSEQ, SARLAFT, BASC, RUC y HACCP, garantizando trazabilidad total para auditorías y certificaciones.",
    iconName: "ShieldCheck",
    benefits: [
      "100% de cumplimiento en auditorías de certificación y entes reguladores",
      "Matriz integrada de riesgos y planes de acción preventivos",
      "Control ágil de hallazgos, no conformidades y oportunidades de mejora",
      "Indicadores de desempeño y reportes directivos en tiempo real",
    ],
    deliverables: [
      "Módulo de Cumplimiento Normativo Parametrizado",
      "Matriz de Riesgos y Peligros (SG-SST, SARLAFT, BASC)",
      "Gestor de Auditorías Internas y Externas",
      "Tablero de Control de Indicadores de Gestión",
    ],
    targetAudience: "Líderes de Calidad, Coordinadores HSEQ, Oficiales de Cumplimiento SARLAFT y Gerencias Generales.",
  },
  {
    id: "procesos-personas",
    slug: "gestion-procesos-operaciones-personas",
    title: "Planear, Gestionar, Controlar y Evaluar",
    shortDescription: "Plataforma dinámica y ágil para orquestar procesos, operaciones diarias y evaluación del desempeño de personas.",
    fullDescription: "Permite a las organizaciones diseñar flujos de trabajo eficientes, supervisar la ejecución de tareas operativas y medir el rendimiento de los colaboradores. Alinea las metas estratégicas con la operación diaria con agilidad y criterio.",
    iconName: "BarChart3",
    benefits: [
      "Visibilidad 360° del estado de proyectos y operaciones en curso",
      "Evaluación objetiva del desempeño y competencias del talento humano",
      "Eliminación de cuellos de botella y duplicidad de funciones",
      "Aumento verificable en la productividad de los equipos de trabajo",
    ],
    deliverables: [
      "Mapa Interactivo de Procesos y Flujos Operativos",
      "Módulo de Asignación, Control y Vencimiento de Tareas",
      "Sistema de Evaluación de Desempeño y Metas por Colaborador",
    ],
    targetAudience: "Directores de Operaciones (COO), Gerentes de Procesos y Directores de Talento Humano.",
  },
  {
    id: "cero-papel",
    slug: "gestion-documental-cero-papel",
    title: "Gestión Documental & Filosofía Cero Papel",
    shortDescription: "Organiza, radica y virtualiza toda la documentación. Reduce el impacto ambiental y minimiza costos operativos.",
    fullDescription: "Digitalice el ciclo completo de su información: desde la radicación de correspondencia interna y externa hasta la custodia segura y firmas digitales. Con la filosofía de cero papel, su organización reduce gastos en suministros, optimiza tiempos de búsqueda y respalda la sostenibilidad ambiental.",
    iconName: "Workflow",
    benefits: [
      "Reducción de hasta un 80% en costos de papelería, impresión y archivo físico",
      "Radicación inmediata y seguimiento en tiempo real de correspondencia",
      "Búsqueda instantánea de expedientes y control estricto de versiones",
      "Disminución directa de la huella de carbono institucional",
    ],
    deliverables: [
      "Ventanilla Única de Radicación Virtual",
      "Repositorio Digital Estructurado con Tablas de Retención",
      "Control de Versiones y Políticas de Acceso Documental",
    ],
    targetAudience: "Secretarías Generales, Directores Administrativos y Líderes de Gestión Documental.",
  },
  {
    id: "licenciamiento-ilimitado",
    slug: "software-sin-costo-licencia",
    title: "Software Sin Costo de Licencia • Usuarios Ilimitados",
    shortDescription: "Acceda a todos los módulos sin límite de usuarios. La empresa solo invierte en almacenamiento y hosting seguro.",
    fullDescription: "Disrumpimos el modelo tradicional de cobro por usuario o por módulo. Con NeoGestión toda su empresa tiene acceso a la plataforma sin costos ocultos de licencias. La inversión se enfoca únicamente en el almacenamiento y hosting seguro de alta disponibilidad con servidor de backup como respaldo.",
    iconName: "Cpu",
    benefits: [
      "Sin límite de usuarios: conecte a toda su organización sin costo extra",
      "Acceso ilimitado a todos los módulos y futuras actualizaciones",
      "Servidor de backup redundante para máxima seguridad y continuidad",
      "Inversión justa, transparente y altamente predecible",
    ],
    deliverables: [
      "Instancia Empresarial Dedicada",
      "Hosting Seguro de Alta Disponibilidad",
      "Configuración de Servidor de Backup Automatizado",
      "Soporte y Monitoreo Continuo de Infraestructura",
    ],
    targetAudience: "Gerencias Generales, Directores Financieros (CFO) y Líderes de Tecnología.",
  },
  {
    id: "crm-scm",
    slug: "modulos-crm-scm-integrados",
    title: "Módulos Integrados CRM & Cadena de Suministro (SCM)",
    shortDescription: "Gestione relaciones con clientes y optimice compras, proveedores y cadena logística desde un solo ecosistema.",
    fullDescription: "Conecte la gestión comercial con la cadena de aprovisionamiento. NeoGestión integra herramientas de CRM para potenciar las ventas y fidelización, junto con módulos SCM para administrar proveedores, órdenes de compra, contratos y evaluaciones comerciales.",
    iconName: "Network",
    benefits: [
      "Control centralizado del ciclo de vida del cliente (Lead to Cash)",
      "Evaluación y selección objetiva de proveedores críticos",
      "Trazabilidad completa de órdenes de compra y acuerdos de nivel de servicio",
      "Sinergia operativa entre el área comercial y logística",
    ],
    deliverables: [
      "Módulo Comercial CRM con Pipeline de Oportunidades",
      "Portal y Directorio Calificado de Proveedores",
      "Flujos de Aprobación de Compras y Suministros",
    ],
    targetAudience: "Directores Comerciales, Gerentes de Compras y Jefes de Cadena de Suministro.",
  },
  {
    id: "identidad-visual",
    slug: "personalizacion-identidad-visual",
    title: "Marca Blanca & Personalización de Identidad Visual",
    shortDescription: "El software mantiene la identidad visual de su empresa: logotipos, colores institucionales y dominio corporativo.",
    fullDescription: "Fomente el sentido de pertenencia de sus colaboradores y proyecte profesionalismo ante sus clientes y proveedores. NeoGestión se personaliza con la identidad corporativa de su organización, integrando su paleta de color, marcas gráficas y accesos institucionales.",
    iconName: "Sparkles",
    benefits: [
      "Adopción cultural inmediata gracias al reconocimiento de marca",
      "Experiencia de usuario institucional coherente con sus directrices gráficas",
      "Mayor confianza de clientes y contratistas en portales de autogestión",
      "Despliegue bajo subdominio corporativo de la empresa",
    ],
    deliverables: [
      "Parametrización Gráfica (Logos, Paleta de Colores, Favicon)",
      "Plantillas Documentales con Membrete Institucional",
      "Configuración de Accesos Personalizados para Colaboradores",
    ],
    targetAudience: "Comités de Marca, Directores de Comunicaciones y Gerencias de Innovación.",
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
