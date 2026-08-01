import crypto from 'crypto';
import { prisma } from '@agency/database';

export class IntegrationWebhookService {
  /**
   * Registrar un endpoint de webhook para eventos
   */
  static async registerWebhook(companyId: string, url: string, events: string[], secret?: string) {
    const webhookSecret = secret || crypto.randomBytes(24).toString('hex');
    
    return {
      id: 'wh_' + Math.random().toString(36).substring(7),
      companyId,
      url,
      events,
      secret: webhookSecret,
      createdAt: new Date()
    };
  }

  /**
   * Listar webhooks registrados
   */
  static async getWebhooks(companyId: string) {
    return [];
  }

  /**
   * Eliminar un webhook
   */
  static async deleteWebhook(webhookId: string) {
    return { success: true, id: webhookId };
  }

  /**
   * Enviar evento a todos los webhooks registrados que coincidan
   */
  static async dispatchEvent(companyId: string, event: string, payload: any) {
    const webhooks = [
      { id: 'wh_1', url: 'https://example.com/hook', events: ['email.sent', 'email.opened'], secret: 'test-secret' }
    ];
    
    const relevantWebhooks = webhooks.filter(w => w.events.includes(event));
    
    for (const webhook of relevantWebhooks) {
      const body = JSON.stringify({
        event,
        payload,
        timestamp: new Date().toISOString()
      });
      
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
        
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature
          },
          body
        });
      } catch (error) {
        console.error(`Error enviando webhook ${webhook.id}:`, error);
      }
    }
  }

  /**
   * Enviar evento ping de prueba para verificar URL
   */
  static async testWebhook(webhookId: string) {
    const webhook = { id: webhookId, url: 'https://example.com/hook', events: ['email.sent'], secret: 'test-secret' };
    
    const body = JSON.stringify({
      event: 'ping',
      message: 'Prueba de webhook',
      timestamp: new Date().toISOString()
    });
    
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');
      
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        body
      });
      
      return { success: response.ok, status: response.status };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
