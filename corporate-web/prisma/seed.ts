import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed para NEOGESTIÓN...");

  // 1. Crear Usuario Administrador
  const adminEmail = "admin@neogestion.com";
  const passwordHash = await bcrypt.hash("Neogestion2025!", 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Dirección NEOGESTIÓN",
      passwordHash,
    },
  });

  console.log(`Usuario administrador listo: ${admin.email}`);

  // 2. Artículos del Blog Reales
  const posts = [
    {
      slug: "tendencias-estrategia-corporativa-2025",
      title: "5 Tendencias Críticas de Estrategia Corporativa para el Trienio 2025-2027",
      excerpt: "Descubra cómo las juntas directivas líderes están reconfigurando sus modelos de asignación de capital e innovación continua frente a la volatilidad económica.",
      category: "Estrategia",
      authorName: "Carlos Mendoza R.",
      authorRole: "Socio Director General",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      readTime: "6 min de lectura",
      published: true,
      viewsCount: 342,
      content: `El entorno corporativo global atraviesa una transición decisiva. La combinación de tasas de interés cambiantes, disrupciones en cadenas de suministro y la aceleración de la inteligencia artificial exige una revisión exhaustiva de los planes quinquenales tradicionales.

1. De la planeación rígida a la adaptabilidad por escenarios: Las empresas ya no pueden depender de previsiones estáticas. Hoy es mandatorio diseñar marcos de toma de decisión basados en simulaciones de estrés.

2. El imperativo de la eficiencia operativa financiada: Los programas de optimización de costos deben liberar recursos directos para reinvertir en digitalización y retención de talento clave.

3. Gobernanza digital en la junta directiva: La tecnología ha dejado de ser un tema relegado al departamento de sistemas; hoy conforma el núcleo de la discusión de gobernanza.

Conclusión: Aquellas corporaciones que actúen con proactividad y rigor analítico consolidarán ventajas competitivas sostenibles frente a competidores más lentos.`,
    },
    {
      slug: "retorno-inversion-nube-empresarial",
      title: "Cómo Maximizar el ROI Real en Proyectos de Modernización Cloud",
      excerpt: "Claves de arquitectura y gobernanza financiera (FinOps) para evitar sobrecostos descontrolados y acelerar la agilidad técnica.",
      category: "Tecnología",
      authorName: "Dra. Elena Valencia",
      authorRole: "Socia de Transformación Cloud",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
      readTime: "8 min de lectura",
      published: true,
      viewsCount: 289,
      content: `Muchas compañías migran cargas a la nube esperando reducciones de costo inmediatas, solo para encontrarse con facturas mensuales imprevistas.

El factor diferenciador no es la tecnología en sí, sino el marco operativo que acompaña la migración. La disciplina de FinOps (Financial Operations) permite alinear la ingeniería con las finanzas corporativas.

Principios esenciales para el éxito:
- Rediseño nativo en lugar del mero 'Lift and Shift'.
- Monitoreo de costos por producto o unidad de negocio.
- Políticas automáticas de apagado de recursos no productivos.

Al adoptar estas prácticas, nuestras empresas clientes han alcanzado ahorros promedio de entre el 30% y el 45% en sus costos de infraestructura.`,
    },
    {
      slug: "resiliencia-ciberseguridad-c-level",
      title: "Ciberseguridad para el C-Level: De la Protección Técnica a la Resiliencia del Negocio",
      excerpt: "Por qué la ciberseguridad debe abordarse como un riesgo operativo y reputacional de primer orden en las organizaciones.",
      category: "Ciberseguridad",
      authorName: "Lic. Sofía Arismendi",
      authorRole: "Directora de Ciberseguridad",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
      readTime: "5 min de lectura",
      published: true,
      viewsCount: 415,
      content: `No existe sistema 100% invulnerable. La verdadera madurez corporativa en seguridad digital radica en la capacidad de detectar a tiempo, contener el incidente y recuperarse en minutos sin paralizar la operación.

Elementos indispensables en la agenda del Comité de Riesgos:
1. Simulacros periódicos de crisis con el equipo directivo.
2. Auditorías de terceros en la cadena de proveedores (Third-Party Risk).
3. Arquitectura Zero Trust con autenticación multifactor universal.

Proteger la confianza de los clientes es el activo intangible más valioso de cualquier firma.`,
    },
    {
      slug: "gestion-del-cambio-adopcion-ia",
      title: "El Factor Humano en la Adopción de IA: Liderando la Transformación Cultural",
      excerpt: "Estrategias prácticas para capacitar a los colaboradores y superar la resistencia al cambio en proyectos de automatización.",
      category: "Gestión",
      authorName: "Carlos Mendoza R.",
      authorRole: "Socio Director General",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      readTime: "7 min de lectura",
      published: true,
      viewsCount: 198,
      content: `La implementación de herramientas de inteligencia artificial genera con frecuencia incertidumbre en los equipos de trabajo.

Para que las iniciativas prosperen, la dirección general debe comunicar con total transparencia el propósito: la tecnología llega para potenciar las capacidades del colaborador, no para reemplazar su criterio profesional.

Recomendaciones clave:
- Diseñar programas de 'Upskilling' desde el día uno del proyecto.
- Reconocer y premiar a los 'early adopters' que identifican casos de uso en sus áreas.
- Medir no solo el éxito técnico, sino también la satisfacción y el bienestar del equipo.`,
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }

  console.log("Artículos de blog insertados con éxito.");

  // 3. Registrar eventos de analítica iniciales de referencia
  const initialEvents = [
    { path: "/", eventType: "pageview", deviceType: "desktop" },
    { path: "/servicios", eventType: "pageview", deviceType: "desktop" },
    { path: "/quienes-somos", eventType: "pageview", deviceType: "mobile" },
    { path: "/blog", eventType: "pageview", deviceType: "desktop" },
    { path: "/contacto", eventType: "pageview", deviceType: "mobile" },
    { path: "/", eventType: "whatsapp_click", deviceType: "mobile" },
    { path: "/contacto", eventType: "form_submission", deviceType: "desktop" },
  ];

  for (const ev of initialEvents) {
    await prisma.analyticsEvent.create({
      data: ev,
    });
  }

  console.log("Analíticas iniciales registradas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
