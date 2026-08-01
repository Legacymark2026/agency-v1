import { prisma } from "@agency/database";

export class TemplateGalleryService {
  /**
   * Obtiene la lista de plantillas disponibles (sistema y personalizadas)
   */
  static async getTemplates(companyId?: string, category?: string) {
    let allTemplates = [...this.getSystemTemplates()];

    if (companyId) {
      try {
        const dbTemplates = await (prisma as any).emailTemplate.findMany({
          where: { companyId }
        });
        allTemplates = [...allTemplates, ...dbTemplates];
      } catch (err) {
        console.warn("[getTemplates] Error fetching company templates:", err);
      }
    }

    if (category) {
      allTemplates = allTemplates.filter(t => t.category === category);
    }
    return allTemplates;
  }

  /**
   * Obtiene una plantilla específica
   */
  static async getTemplate(templateId: string) {
    const sysTemplate = this.getSystemTemplates().find(t => t.id === templateId);
    if (sysTemplate) return sysTemplate;
    
    try {
      return await (prisma as any).emailTemplate.findUnique({ where: { id: templateId } });
    } catch (err) {
      throw new Error("Plantilla no encontrada");
    }
  }

  /**
   * Crea una plantilla personalizada
   */
  static async createTemplate(companyId: string, data: any) {
    return (prisma as any).emailTemplate.create({
      data: {
        ...data,
        companyId,
        isSystem: false
      }
    });
  }

  /**
   * Clona una plantilla existente
   */
  static async cloneTemplate(templateId: string, companyId: string) {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error("Plantilla no encontrada");
    
    return (prisma as any).emailTemplate.create({
      data: {
        name: `${template.name} (Copia)`,
        category: template.category,
        description: template.description,
        thumbnail: template.thumbnail,
        html: template.html,
        companyId,
        isSystem: false
      }
    });
  }

  /**
   * Retorna las categorías disponibles
   */
  static async getCategories() {
    return [
      "Bienvenida",
      "Promoción",
      "Newsletter",
      "Seguimiento B2B",
      "Abandono de Carrito",
      "Reactivación"
    ];
  }

  /**
   * Retorna plantillas profesionales de sistema con HTML responsivo y moderno
   */
  static getSystemTemplates() {
    return [
      {
        id: "sys_tpl_1",
        name: "Bienvenida",
        category: "Bienvenida",
        description: "Email de bienvenida con gradiente, logo y CTA",
        thumbnail: "👋",
        isSystem: true,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; }
  .header img { max-width: 150px; }
  .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
  .content h1 { color: #111827; font-size: 24px; margin-bottom: 20px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; text-align: center; }
  .footer { padding: 20px 30px; background-color: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; }
  @media (prefers-color-scheme: dark) {
    body { background-color: #111827; }
    .container { background: #1f2937; }
    .content, .content h1 { color: #f3f4f6; }
    .footer { background-color: #111827; border-top-color: #374151; }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://via.placeholder.com/150x50/ffffff/4f46e5?text=TU+LOGO" alt="Logo">
    </div>
    <div class="content">
      <h1>¡Te damos la bienvenida! 🎉</h1>
      <p>Hola {{name}}, estamos muy emocionados de tenerte con nosotros. Nuestro objetivo es ayudarte a lograr tus metas y brindarte las mejores herramientas del mercado.</p>
      <p>Para empezar, te invitamos a completar tu perfil y descubrir todo lo que hemos preparado para ti.</p>
      <div style="text-align: center;">
        <a href="#" class="btn">Comenzar ahora</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Tu Empresa. Todos los derechos reservados.</p>
      <p>Si no deseas recibir más correos, puedes <a href="{{unsubscribe_url}}" style="color: #6b7280;">darte de baja</a>.</p>
    </div>
  </div>
</body>
</html>`
      },
      {
        id: "sys_tpl_2",
        name: "Promoción Flash",
        category: "Promoción",
        description: "Oferta especial con sentido de urgencia",
        thumbnail: "🛍️",
        isSystem: true,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: Arial, sans-serif; background-color: #fce7f3; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .hero { background-color: #ec4899; color: white; padding: 50px 20px; text-align: center; }
  .hero h1 { margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 2px; }
  .timer { background: #be185d; color: white; padding: 10px; font-size: 20px; font-weight: bold; text-align: center; }
  .content { padding: 30px; text-align: center; color: #4b5563; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .item { border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; }
  .item img { max-width: 100%; border-radius: 4px; }
  .price { color: #ec4899; font-weight: bold; font-size: 18px; margin: 10px 0; }
  .btn { display: inline-block; background-color: #ec4899; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 18px; text-transform: uppercase; }
  .footer { padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>¡Venta Flash! ⚡</h1>
      <p>Hasta 50% de descuento en artículos seleccionados</p>
    </div>
    <div class="timer">⏳ La oferta termina en 24 horas</div>
    <div class="content">
      <p>Hola {{name}}, aprovecha nuestros precios especiales por tiempo limitado. ¡No dejes que se agoten!</p>
      <div class="grid">
        <div class="item">
          <img src="https://via.placeholder.com/200?text=Producto+1" alt="Producto 1">
          <h3>Producto Premium</h3>
          <div class="price">$49.99 <strike style="color:#9ca3af;font-size:14px">$99.99</strike></div>
        </div>
        <div class="item">
          <img src="https://via.placeholder.com/200?text=Producto+2" alt="Producto 2">
          <h3>Producto Pro</h3>
          <div class="price">$29.99 <strike style="color:#9ca3af;font-size:14px">$59.99</strike></div>
        </div>
      </div>
      <a href="#" class="btn">Comprar Ahora</a>
    </div>
    <div class="footer">
      <p>Oferta válida hasta agotar existencias.</p>
    </div>
  </div>
</body>
</html>`
      },
      {
        id: "sys_tpl_3",
        name: "Boletín Informativo",
        category: "Newsletter",
        description: "Layout limpio para múltiples artículos y noticias",
        thumbnail: "📰",
        isSystem: true,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #e5e7eb; margin: 0; }
  .wrapper { width: 100%; max-width: 600px; margin: 30px auto; background: #ffffff; }
  .header { padding: 30px; text-align: center; border-bottom: 2px solid #f3f4f6; }
  .header h2 { margin: 0; color: #1f2937; letter-spacing: 1px; }
  .article { padding: 30px; border-bottom: 1px solid #f3f4f6; }
  .article img { width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px; }
  .article h3 { color: #111827; margin-top: 0; }
  .article p { color: #4b5563; line-height: 1.6; }
  .read-more { color: #2563eb; text-decoration: none; font-weight: 600; }
  .social-links { text-align: center; padding: 20px; background: #1f2937; color: white; }
  .social-links a { color: #9ca3af; margin: 0 10px; text-decoration: none; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h2>BOLETÍN SEMANAL</h2>
      <p style="color: #6b7280; font-size: 14px;">Las últimas novedades y actualizaciones</p>
    </div>
    <div class="article">
      <img src="https://via.placeholder.com/540x200?text=Noticia+Principal" alt="Noticia 1">
      <h3>Nueva función revolucionaria</h3>
      <p>Descubre cómo nuestra última actualización te ayudará a ahorrar tiempo y mejorar tus flujos de trabajo en cuestión de minutos.</p>
      <a href="#" class="read-more">Leer artículo completo →</a>
    </div>
    <div class="article">
      <h3>5 Tips para mejorar tu productividad</h3>
      <p>Hemos recopilado las mejores prácticas de nuestros expertos para que le saques el máximo provecho a tus herramientas del día a día.</p>
      <a href="#" class="read-more">Ver los tips →</a>
    </div>
    <div class="social-links">
      <p>Síguenos en nuestras redes</p>
      <a href="#">Twitter</a> | <a href="#">LinkedIn</a> | <a href="#">Instagram</a>
    </div>
  </div>
</body>
</html>`
      },
      {
        id: "sys_tpl_4",
        name: "Seguimiento B2B",
        category: "Seguimiento B2B",
        description: "Email profesional en texto plano enriquecido para ventas B2B",
        thumbnail: "🤝",
        isSystem: true,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #333333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; padding: 20px; font-size: 16px; line-height: 1.5; }
  .signature { margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px; }
  .signature strong { display: block; margin-bottom: 5px; }
  .signature img { border-radius: 50%; margin-top: 10px; width: 60px; }
  .cta-link { display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 500; border-radius: 6px; margin: 20px 0; }
  .social-proof { background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; font-style: italic; margin: 20px 0; }
</style>
</head>
<body>
  <div class="container">
    <p>Hola {{name}},</p>
    <p>La semana pasada intenté contactarte sobre cómo podemos mejorar los procesos en tu empresa.</p>
    <p>Sé que estás muy ocupado/a, pero quería compartirte rápidamente cómo ayudamos a una empresa similar a la tuya a reducir sus costos operativos en un 30% en solo dos meses.</p>
    
    <div class="social-proof">
      "Implementar esta solución fue la mejor decisión del año. El ROI fue casi inmediato." - CEO, Empresa Cliente
    </div>
    
    <p>¿Tendrías 10 minutos este martes o miércoles para una breve charla exploratoria? Sin compromisos.</p>
    
    <a href="#" class="cta-link">Agendar llamada de 10 min</a>
    
    <p>Quedo atento a tus comentarios.</p>
    
    <div class="signature">
      <strong>Juan Pérez</strong>
      <span style="color: #666;">Director de Cuentas Estratégicas</span><br>
      <img src="https://via.placeholder.com/60" alt="Avatar">
    </div>
  </div>
</body>
</html>`
      },
      {
        id: "sys_tpl_5",
        name: "Abandono de Carrito",
        category: "Abandono de Carrito",
        description: "Recordatorio con imagen de producto y urgencia",
        thumbnail: "🛒",
        isSystem: true,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; }
  .card { max-width: 550px; margin: 40px auto; background: white; padding: 40px; text-align: center; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .icon { font-size: 50px; margin-bottom: 20px; }
  h1 { color: #111827; margin-bottom: 10px; }
  p { color: #6b7280; line-height: 1.6; }
  .cart-item { display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0; }
  .cart-item img { max-width: 80px; margin-right: 20px; }
  .cart-item-details { text-align: left; }
  .cart-item-title { font-weight: bold; color: #374151; }
  .btn { display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.3s; }
  .urgency { margin-top: 30px; font-size: 14px; color: #ef4444; font-weight: bold; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">🛒</div>
    <h1>¡Ups! Dejaste algo atrás...</h1>
    <p>Hola {{name}}, notamos que agregaste algunos artículos increíbles a tu carrito, pero no completaste tu compra. ¡No te preocupes, los hemos guardado para ti!</p>
    
    <div class="cart-item">
      <img src="https://via.placeholder.com/80" alt="Item">
      <div class="cart-item-details">
        <div class="cart-item-title">Tu Producto Seleccionado</div>
        <div style="color: #6b7280;">Cantidad: 1</div>
      </div>
    </div>
    
    <a href="#" class="btn">Finalizar mi compra</a>
    
    <div class="urgency">
      ¡Apúrate! El inventario es limitado y tu carrito podría vaciarse pronto.
    </div>
  </div>
</body>
</html>`
      },
      {
        id: "sys_tpl_6",
        name: "Reactivación de Usuarios",
        category: "Reactivación",
        description: "Campaña para recuperar usuarios inactivos con descuento especial",
        thumbnail: "❤️",
        isSystem: true,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; margin: 0; }
  .box { max-width: 600px; margin: 50px auto; background: white; border-top: 6px solid #8b5cf6; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  h1 { color: #8b5cf6; text-align: center; }
  p { color: #52525b; line-height: 1.7; font-size: 16px; }
  .offer { text-align: center; background: #f3e8ff; border: 2px dashed #a855f7; padding: 20px; border-radius: 8px; margin: 30px 0; }
  .offer-code { font-size: 24px; font-weight: bold; color: #7e22ce; letter-spacing: 2px; display: block; margin-top: 10px; }
  .btn { display: block; width: max-content; margin: 0 auto; background: #8b5cf6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; }
</style>
</head>
<body>
  <div class="box">
    <h1>¡Te echamos de menos, {{name}}! 🥺</h1>
    <p>Ha pasado un tiempo desde tu última visita y queríamos saber si todo está bien. Hemos añadido un montón de nuevas características desde la última vez que iniciaste sesión.</p>
    <p>Para animarte a volver y que pruebes todas las novedades, hemos preparado un regalo especial solo para ti:</p>
    
    <div class="offer">
      Usa este código para obtener un <strong>20% de descuento</strong> en tu próximo mes:
      <span class="offer-code">VUELVE20</span>
    </div>
    
    <a href="#" class="btn">Reclamar mi descuento</a>
    
    <p style="text-align: center; margin-top: 40px; font-size: 14px; color: #a1a1aa;">
      Si tienes alguna pregunta o necesitas ayuda para volver a empezar, simplemente responde a este correo.
    </p>
  </div>
</body>
</html>`
      }
    ];
  }
}
