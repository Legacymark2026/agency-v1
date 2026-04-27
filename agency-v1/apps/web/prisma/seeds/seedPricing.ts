import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rawData = `
ASESORÍAS	ACTIVO	AC-001	Consultoría Estratégica	Creación de Marca	1 hora	Definición de identidad, naming, valores y posicionamiento	Google Workspace, Zoom, Miro	$ 100.000
ASESORÍAS	ACTIVO	AC-002	Consultoría Táctica	Estrategia Digital Inicial	2 horas	Plan de acción 90 días, canales prioritarios, KPIs	Google Analytics, SEMrush	$ 180.000
ASESORÍAS	ACTIVO	AC-003	Consultoría Especializada	Auditoría de Competencia	2 horas	Análisis de 3 competidores directos, fortalezas y oportunidades	Figma, Adobe XD	$ 400.000
ASESORÍAS	ACTIVO	AC-004	Consultoría Técnica	SEO On-Page Básico	1.5 horas	Revisión y recomendaciones técnicas para mejora SEO	Screaming Frog, GTmetrix	$ 180.000
ASESORÍAS	ACTIVO	AC-005	Legal Digital	Compliance RGPD/Ley 1581	2 horas	Aseguramiento de cumplimiento en protección de datos	DocuSign, PandaDoc	$ 280.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTIVO	CC-001	Edicion de video	Edicion de video un hd o 4k 	2 horas	Edicion de video duraccion de 1 minuto con cortes, sonido y estilo deacuerdo a indicaciones del cliente	Adobe Premiere Pro, CapCut	$100.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTIVO	CC-002	Video MP4	Reel para Redes Sociales	2 horas	Video vertical 15-30s, edición básica, música y subtítulos	Adobe Premiere Pro, Canva Pro,CapCut	$ 300.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTYIVO	CC-003	Video MP4	Video Institucional	4 horas	Video 1-2 minutos, guión, edición profesional, motion graphics	Adobe Creative Cloud, DaVinci Resolve	$ 600.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTIVO	CC-004	Imagen PNG/JPG	Post para Redes	30 minutos	Diseño gráfico para feed, stories o carrusel	Adobe Photoshop, Canva Pro	$ 100.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTIVO	CC-005	Documento	Ideas para Videos (10 ideas)	1 hora	Brainstorming y guiones básicos para contenido audiovisual	Google Docs, Microsoft 365	$ 180.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTIVO	CC-006	Carousel PNG/PDF	Carrusel Educativo	1.5 horas	5-7 slides informativas con diseño atractivo	Adobe Illustrator, Canva Pro	$ 150.000
CREACIÓN DE CONTENIDO/AUDOVISUAL	ACTIVO	CC-007	Copywriting/Guiones	Texto para Post (hasta 200 palabras)	30 minutos	Copy optimizado para engagement y conversión	Google Docs, Hemingway Editor	$ 80.000
AUDOVISUAL	ACTIVO	AV-001	Fotografía	Sesión producto (10 fotos)	4 horas	Fotografía profesional, edición, entrega digital	Adobe Lightroom, Capture One	$ 600.000
AUDOVISUAL	ACTIVO	AV-002	Video Corporativo	Video testimonial cliente	1 día producción	Guión, grabación, edición, motion graphics básico	Adobe Premiere Pro, After Effects	$ 800.000
AUDOVISUAL	ACTIVO	AV-003	Animación 2D	Video explicativo animado	3-5 días	Storyboard, animación, voz en off, música	Adobe After Effects, Blender	$ 1.200.000
AUDOVISUAL	ACTIVO	AV-004	Podcast	Producción episodio (30 min)	1 día	Grabación, edición, publicación, transcripción	Audacity, Adobe Audition	$ 1.000.000
REDES SOCIALES	ACTIVO	SM-001	Community Management	Gestión 1 red social/mes	Mensual	Estrategia, contenido, interacción, reporte mensual	Hootsuite, Buffer	$ 800.000
REDES SOCIALES	ACTIVO	SM-002	Estructuracion de meta ads	Creacion de pagina en meta business	1 semana	Creacion y estructuracion de la pagina con enlaces de respuesta a clientes potenciales	Meta Business Suite.	$ 500.000
REDES SOCIALES	ACTIVO	SM-003	Social Media Ads	Campañas orgánicas boosteadas	Mensual	Segmentación, creativos, optimización, reportes	Meta Business Suite, TikTok Ads	$ 1.000.000
REDES SOCIALES	ACTIVO	SM-004	Calendario Editorial	Plan anual contenido	3 días	Estrategia temática, fechas clave, recursos necesarios	Google Calendar, Trello	$ 900.000
REDES SOCIALES	ACTIVO	SM-005	Monitoreo de Marca	Social listening básico	Mensual	Seguimiento menciones, sentimiento, tendencias	Brandwatch, Mention	$ 600.000
SEO Y POSICIONAMIENTO	ACTIVO	SE-001	SEO Local	Optimización Google My Business	3 días	Perfil completo, reseñas, fotos, posts regulares	Google My Business, BrightLocal	$ 450.000
SEO Y POSICIONAMIENTO	ACTIVO	SE-002	Link Building	Construcción de 5 backlinks	15 días	Investigación, outreach, publicación, reporte	Ahrefs, SEMrush	$ 750.000
SEO Y POSICIONAMIENTO	ACTIVO	SE-003	SEO Técnico Avanzado	Auditoría profunda + implementación	7-10 días	Crawl budget, indexación, velocidad, seguridad	Screaming Frog, DeepCrawl	$ 2.000.000
SEO Y POSICIONAMIENTO	ACTIVO	SE-004	SEO Internacional	Configuración multilingüe	5 días	hreflang, geotargeting, contenido localizado	SEMrush, hreflang Generator	$ 1.200.000
EMAIL MARKETING	ACTIVO	EM-001	Diseño Template	Template HTML responsive	2 días	Diseño personalizado, compatibilidad multidispositivo	Mailchimp, Beefree	$ 400.000
EMAIL MARKETING	ACTIVO	EM-002	Automatización	Funnel de nutrición de leads	3-5 días	Segmentación, triggers, workflows personalizados	ActiveCampaign, HubSpot	$ 900.000
EMAIL MARKETING	ACTIVO	EM-003	Newsletter Mensual	Diseño + copy + envío	1 día/mes	Contenido mensual, diseño atractivo, métricas	Mailchimp, SendGrid	$ 300.000
EMAIL MARKETING	ACTIVO	EM-004	A/B Testing	Campaña con pruebas multivariable	2 días	Testeo sujeto, contenido, horarios, segmentos	Mailchimp, HubSpot	$ 500.000
PUBLICIDAD PAGADA	ACTIVO	AD-001	Meta Ads Avanzado	Campañas con pixel avanzado	5 días setup + gestión	Eventos personalizados, conversiones, lookalike	Facebook Ads Manager, AdEspresso	$ 1.800.000
PUBLICIDAD PAGADA	ACTIVO	AD-002	Google Shopping	Configuración feed productos	3 días	Feed optimizado, campañas shopping, remarketing	Google Merchant Center, DataFeedWatch	$ 1.200.000
PUBLICIDAD PAGADA	ACTIVO	AD-003	YouTube Ads	Campaña video	4 días	Segmentación por intereses, remarketing video	Google Ads, YouTube Studio	$ 1.500.000
PUBLICIDAD PAGADA	ACTIVO	AD-004	LinkedIn B2B	Campañas para empresas	3 días	Segmentación por empresa, cargo, industria	LinkedIn Campaign Manager	$ 2.000.000
ANALYTICS Y DATOS	ACTIVO	AN-001	Dashboard Personalizado	Google Data Studio	3 días	Conexión múltiples fuentes, KPIs visuales	Google Data Studio, Tableau	$ 600.000
ANALYTICS Y DATOS	ACTIVO	AN-002	Implementación GA4	Configuración completa	2 días	Eventos, conversiones, ecommerce tracking	Google Analytics 4, Google Tag Manager	$ 400.000
ANALYTICS Y DATOS	ACTIVO	AN-003	Heatmaps	Análisis comportamiento usuarios	7 días	Instalación, recolección datos, informe insights	Hotjar, Crazy Egg	$ 350.000
ANALYTICS Y DATOS	ACTIVO	AN-004	Attribution Modeling	Modelo atribución multicanal	5 días	Análisis rutas conversión, valoración canales	Google Analytics 4, Northbeam	$ 1.000.000
DESARROLLO WEB	ACTIVO	DW-001	Landing Page	Diseño y Desarrollo LP	3-5 días	Landing page responsive, formularios, integración analytics	Unbounce, Instapage	$ 1.500.000
DESARROLLO WEB	ACTIVO	DW-002	Sitio Web Corporativo	Web 5-8 páginas	10-15 días	Diseño personalizado, CMS, SEO básico, hosting 1 año	WordPress, Webflow	$ 4.500.000
DESARROLLO WEB	ACTIVO	DW-003	E-commerce Básico	Tienda online 10-15 productos	15-20 días	Carrito compras, pasarela pagos, gestión inventario	Shopify, WooCommerce	$ 6.000.000
DESARROLLO WEB	ACTIVO	DW-004	Micrositio	Sitio web 1-3 páginas	5-7 días	Sitio especializado para campañas específicas	WordPress, Wix	$ 2.500.000
OPTIMIZACIÓN	ACTIVO	0P-001	SEO Técnico	Posicionamiento Web Básico	5-7 días	Optimización on-page, meta tags, velocidad, mobile-friendly	Screaming Frog, Google Search Console	$ 800.000
OPTIMIZACIÓN	ACTIVO	0P-002	SEO Avanzado	Posicionamiento Web Completo	10-15 días	SEO técnico + contenido + backlinks + reporte mensual	SEMrush, Ahrefs	$ 1.500.000
OPTIMIZACIÓN	ACTIVO	0P-003	CRM	Implementación Sistema CRM Básico	3 días	Configuración de CRM, automatizaciones iniciales, capacitación	HubSpot CRM, Salesforce	$ 600.000
OPTIMIZACIÓN	ACTIVO	0P-004	Análisis	Definición y Seguimiento KPIs	1 día	Dashboard con 5-10 KPIs clave, reporte mensual	Google Analytics, Mixpanel	$ 300.000
AUTOMATIZACIÓN	ACTIVO	AT-001	WhatsApp	WhatsApp Business Configuración	1 día	Cuenta profesional, mensajes automatizados, etiquetas	WhatsApp Business API, ManyChat	$ 250.000
AUTOMATIZACIÓN	ACTIVO	AT-002	Email Marketing	Campaña Email Básica	2 días	Diseño template, segmentación lista, automatización	Mailchimp, ActiveCampaign	$ 400.000
AUTOMATIZACIÓN	ACTIVO	AT-003	Chatbot	Chatbot Básico para Web	3 días	Flujos conversacionales, integración con CRM	ManyChat, Chatfuel	$ 750.000
CAMPAÑAS	ACTIVO	CM-001	Meta Ads	Campaña Meta Básica (1 mes)	2 días setup + gestión	Estrategia, creativos, segmentación, optimización semanal	Facebook Ads Manager, AdEspresso	$ 1.200.000
CAMPAÑAS	ACTIVO	CM-002	Google Ads	Campaña Google Básica (1 mes)	2 días setup + gestión	Keywords, ads, extensiones, optimización semanal	Google Ads, Optmyzr	$ 1.500.000
CAMPAÑAS	ACTIVO	CM-003	Campaña Integrada	Meta + Google Ads (1 mes)	3 días setup + gestión	Estrategia multicanal, atribución, reporte consolidado	Google Ads + Meta Ads Manager	$ 2.500.000
IDENTIDAD	ACTIVO	ID-001	Naming	Creación nombre marca	3 días	"	Brainstorming y verificación legal"	Namechk, Namelix	$ 500.000
IDENTIDAD	ACTIVO	ID-002	Manual	Guía completa aplicaciones	10 días	Logotipos, colores, tipografía	Adobe InDesign, Canva	$ 1.800.000
IDENTIDAD	ACTIVO	ID-003	Packaging	Diseño empaque producto	7 días	Diseño estructural y gráfico	Adobe Illustrator, Blender	$ 1.200.000
IDENTIDAD	ACTIVO	ID-004	Papelería	Kit empresarial básico	3 días	Tarjetas y hojas membretadas	Adobe InDesign, Canva Pro	$ 600.000
BRANDING	ACTIVO	BR-001	Básico	Creación Identidad de Marca	5-7 días	Logo, paleta colores, tipografía, manual básico	Adobe Illustrator, Canva Pro	$ 1.000.000
BRANDING	ACTIVO	BR-002	Rebranding	Actualización de Marca	3-5 días	Rediseño logo, actualización manual existente	Adobe Creative Cloud, Canva Pro	$ 600.000
BRANDING	ACTIVO	BR-003	Premium	Identidad de Marca Completa	10-15 días	Logo + alternativas, manual extenso, aplicaciones, tono de voz	Adobe Creative Cloud, Frontify	$ 2.500.000
DOCUMENTOS ESTRATÉGICOS	ACTIVO	DE-001	Brief	Brief Creativo/Marketing	1 día	Documento completo con objetivos, audiencia, mensajes clave	Google Docs, Notion	$ 200.000
DOCUMENTOS ESTRATÉGICOS	ACTIVO	DE-002	Plan de Medios	Plan Estratégico de Medios	3 días	Estrategia multicanal, calendario, presupuesto, métricas	Excel, Google Sheets	$ 800.000
DOCUMENTOS ESTRATÉGICOS	ACTIVO	DE-003	Investigación	Investigación de Mercados	7-10 días	Estudio cuali/cuantitativo, análisis competencia, buyer persona	SEMrush, SurveyMonkey	$ 1.800.000
INFLUENCER MARKETING	ACTIVO	IM-001	Gestión	Agente de Influencers (por campaña)	5-7 días	Búsqueda, negociación, contratación, seguimiento de 3 influencers	Upfluence, AspireIQ	$ 1.000.000
INFLUENCER MARKETING	ACTIVO	IM-002	Producción	Producción Contenido con Influencer	1 día de grabación	Dirección creativa, coordinación logística, supervisión	Adobe Premiere Pro, Canva Pro	$ 500.000
PAQUETES MENSUALES	ACTIVO	PK	Social Media	Gestión 2 Redes + 12 Contenidos	Mensual	Estrategia, creación, programación, reporte	Buffer Pro, Hootsuite	$ 2.500.000
PAQUETES MENSUALES	ACTIVO	PK	Marketing Digital	Social Media + Ads + Reportes	Mensual	Gestión integral, optimización constante, reuniones semanales	HubSpot Marketing Hub, Marketo	$ 5.000.000
PAQUETES MENSUALES	ACTIVO	PK	Enterprise	Solución Completa Digital	Mensual	Equipo dedicado, todas las áreas, estrategia 360°	Salesforce Marketing Cloud, Adobe Experience Cloud	$ 8.000.000
EVENTOS	ACTIVO	EV-001	Webinar	Producción completa	3 días	Plataforma y promoción	Zoom, Webex	$ 900.000
EVENTOS	ACTIVO	EV-002	Híbrido	Presencial + streaming	10 días	Logística y tecnología	Zoom, Eventbrite	$ 3.000.000
EVENTOS	ACTIVO	EV-003	Activación	Experiencia interactiva	5 días	Gamificación y participación	Eventbrite, Meetup	$ 1.500.000
MANTENIMIENTO	ACTIVO	MS-001	Web	Soporte técnico mensual	Mensual	Actualizaciones y backup	SiteGround, Cloudflare	$ 300.000
MANTENIMIENTO	ACTIVO	MS-002	Marketing	Asistencia técnica	Mensual	Resolución incidentes	HubSpot, ActiveCampaign	$ 500.000
MANTENIMIENTO	ACTIVO	MS-003	Monitoring	Monitoreo 24/7	Mensual	Alertas y reportes	UptimeRobot, Pingdom	$ 800.000
MANTENIMIENTO	ACTIVO	MS-004	Actualización	Gestión contenidos web	Por hora	Actualizaciones texto/imágenes	WordPress, Shopify	$80.000/h
COMPLEMENTARIOS	ACTIVO	SC-001	Traducción	Por palabra	Por palabra	Inglés-Español profesional	DeepL Pro, Google Translate API	$ 500
COMPLEMENTARIOS	ACTIVO	SC-002	Voiceover	Por minuto	Por minuto	Locución profesional	Audacity, Adobe Audition	$ 80.000
COMPLEMENTARIOS	ACTIVO	SC-003	Transcripción	Por minuto audio	Por minuto	Texto de audio/video	Otter.ai, Rev	$ 20.000
COMPLEMENTARIOS	ACTIVO	SC-004	Subtitulado	Por minuto video	Por minuto	SRT format sincronizado	Subtitle Edit, Aegisub	$ 30.000
COMPLEMENTARIOS	ACTIVO	SC-005	Mockup	Por imagen	Por imagen	Presentación en contextos	Adobe Photoshop, Placeit	$ 50.000
COMPLEMENTARIOS	ACTIVO	SC-006	Infografía	Diseño simple	Por proyecto	Datos visualizados	Adobe Illustrator, Canva Pro	$ 200.000
COMPLEMENTARIOS	ACTIVO	SC-007	Presentación	15 slides	Por proyecto	PowerPoint/Google Slides	PowerPoint, Google Slides	$ 400.000
INNOVACIÓN	EN  FORMACION	IN-001	Realidad Aumentada	AR filters Instagram/FB	Por proyecto	Prueba productos interactiva	Spark AR Studio, Lens Studio	$ 2.500.000
INNOVACIÓN	EN  FORMACION	IN-002	Chatbot IA	GPT integración	Por proyecto	Atención cliente 24/7	Dialogflow, IBM Watson	$ 3.000.000
INNOVACIÓN	EN  FORMACION	IN-003	Voice Search	Optimización Alexa/Assistant	Por proyecto	Posicionamiento búsqueda voz	Google Assistant SDK, Alexa Skills Kit	$ 1.200.000
INNOVACIÓN	EN  FORMACION	IN-004	Conversacional	WhatsApp API avanzada	Por proyecto	Ventas por chat automatizado	ManyChat, Chatfuel	$ 1.800.000
INNOVACIÓN	EN  FORMACION	IN-005	Video 360°	Contenido inmersivo	Por proyecto	Tour virtual interactivo	Insta360 Studio, Adobe Premiere Pro	$ 2.200.000
INNOVACIÓN	EN  FORMACION	IN-006	NFT Marketing	Estrategia tokens digitales	Por proyecto	Comunidad y coleccionables	OpenSea, Rarible	$ 3.500.000
INNOVACIÓN	EN  FORMACION	IN-007	Metaverse	Presencia mundos virtuales	Por proyecto	Showroom virtual	Unity, Unreal Engine	$ 4.000.000
FORMACIÓN	EN  FORMACION	FC-001	Training	Capacitación equipo	2 días	Programa adaptado	Zoom, Google Meet	$ 2.500.000
FORMACIÓN	EN  FORMACION	FC-002	E-learning	Curso digital básico	15 días	Guionización y producción	Teachable, Thinkific	$ 3.500.000
FORMACIÓN	EN  FORMACION	FC-003	Mentoría	Acompañamiento 1:1	4 horas/mes	Sesiones estratégicas	Calendly, Google Calendar	$ 600.000
FORMACIÓN	EN  FORMACION	FC-004	Workshop	Taller 4 horas	Medio día	Contenido personalizado	Miro, Mural	$ 1.200.000
`;

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found to attach services to.");
    return;
  }

  // Delete previously seeded demo data just to keep it clean (Optional, but let's do it if they want just this list)
  // await prisma.servicePrice.deleteMany({ where: { companyId: company.id } });

  const lines = rawData.trim().split("\n");
  let orderIndex = 0;

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 9) continue;

    const [cat, estRaw, cod, formato, nombre, tiempo, desc, tools, precioRaw] = parts;
    const isEnFormacion = estRaw.trim() === "EN FORMACION" || estRaw.trim() === "EN  FORMACION" || estRaw.trim() === "EN_FORMACION";
    const estado = isEnFormacion ? "inactivo" : "activo";
    
    // Parse price: Remove $ sign, spaces, dots, /h, /m... 
    // Examples: $ 100.000 -> 100000, $80.000/h -> 80000
    const rawNum = precioRaw.replace(/[^0-9]/g, "");
    const precioBase = Number(rawNum) || 0;

    // Clean codes just in case (replace 0P with OP, etc)
    const cleanedCod = cod.trim().replace(/^0P/, "OP");

    await prisma.servicePrice.create({
      data: {
        companyId: company.id,
        codigo_id: cleanedCod || null,
        categoria: cat.trim(),
        estado: estado,
        tipo_formato: formato.trim() || null,
        nombre_servicio: nombre.trim(),
        tiempo_estimado: tiempo.trim() || null,
        descripcion: desc.trim().replace(/^"|"$/g, "").trim(),
        herramientas: tools.trim() || null,
        precio_base: precioBase,
        iva_porcentaje: 19.0,
        retefuente_porc: 11.0,
        reteiva_porc: 2.85,
        ica_porc: 0.6,
        orderIndex: orderIndex++
      }
    });
  }

  console.log("Successfully seeded " + lines.length + " items!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
