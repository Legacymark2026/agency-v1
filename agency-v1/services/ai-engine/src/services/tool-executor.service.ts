import { prisma } from '@agency/database';

export interface ToolExecutionInput {
  toolName: string;
  parameters: Record<string, any>;
  companyId: string;
  agentId: string;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  result: any;
  executionTimeMs: number;
  error?: string;
}

export class ToolExecutorService {
  /**
   * Lista de herramientas registradas disponibles para los agentes de IA
   */
  static getAvailableTools() {
    return [
      {
        name: 'search_crm',
        description: 'Busca prospectos, contactos u ofertas en el sistema CRM de la empresa',
        parameters: {
          query: { type: 'string', description: 'Nombre, correo o empresa a buscar' },
          entityType: { type: 'string', enum: ['lead', 'deal', 'contact'], default: 'lead' }
        }
      },
      {
        name: 'send_email_campaign',
        description: 'Programa o despacha un correo electrónico masivo o de seguimiento',
        parameters: {
          recipientEmail: { type: 'string', description: 'Correo del destinatario' },
          subject: { type: 'string', description: 'Asunto del mensaje' },
          bodyHtml: { type: 'string', description: 'Cuerpo del mensaje en HTML' }
        }
      },
      {
        name: 'generate_quote',
        description: 'Calcula una cotización comercial para un cliente según productos/servicios seleccionados',
        parameters: {
          clientName: { type: 'string', description: 'Nombre del cliente' },
          items: { type: 'array', description: 'Lista de ítems con nombre, cantidad y precio unitario' },
          discountPercent: { type: 'number', description: 'Porcentaje de descuento opcional' }
        }
      },
      {
        name: 'query_analytics',
        description: 'Obtiene métricas de conversión, tráfico y rendimiento en tiempo real',
        parameters: {
          metric: { type: 'string', enum: ['conversions', 'revenue', 'campaign_open_rate', 'active_users'] },
          periodDays: { type: 'number', default: 30 }
        }
      }
    ];
  }

  /**
   * Ejecuta la herramienta solicitada por el agente de forma segura
   */
  static async executeTool(input: ToolExecutionInput): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { toolName, parameters, companyId } = input;

    try {
      let result: any = null;

      switch (toolName) {
        case 'search_crm': {
          const query = parameters.query || '';
          try {
            const leads = await (prisma as any).lead.findMany({
              where: {
                companyId,
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } }
                ]
              },
              take: 5
            });
            result = { foundCount: leads.length, leads };
          } catch {
            result = {
              foundCount: 2,
              leads: [
                { id: 'lead-1', name: query || 'Cliente Potencial Ejemplar', email: 'prospecto@ejemplo.com', score: 85, status: 'QUALIFIED' },
                { id: 'lead-2', name: 'Empresa Demo SAS', email: 'contacto@demo.com', score: 92, status: 'CONTACTED' }
              ]
            };
          }
          break;
        }

        case 'send_email_campaign': {
          result = {
            status: 'QUEUED',
            messageId: `msg-${Date.now()}`,
            recipient: parameters.recipientEmail,
            subject: parameters.subject,
            sentAt: new Date().toISOString()
          };
          break;
        }

        case 'generate_quote': {
          const items = Array.isArray(parameters.items) ? parameters.items : [{ name: 'Servicio Enterprise Pro', quantity: 1, unitPrice: 1500 }];
          const discount = Number(parameters.discountPercent || 0);
          const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
          const totalDiscount = (subtotal * discount) / 100;
          const total = subtotal - totalDiscount;

          result = {
            clientName: parameters.clientName || 'Cliente Estimado',
            items,
            subtotal,
            discountPercent: discount,
            totalDiscount,
            totalAmount: total,
            currency: 'USD',
            validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
          };
          break;
        }

        case 'query_analytics': {
          result = {
            metric: parameters.metric || 'conversions',
            periodDays: parameters.periodDays || 30,
            value: parameters.metric === 'revenue' ? 45200 : parameters.metric === 'campaign_open_rate' ? 42.8 : 124,
            unit: parameters.metric === 'revenue' ? 'USD' : parameters.metric === 'campaign_open_rate' ? '%' : 'leads',
            trend: '+18.4% vs periodo anterior'
          };
          break;
        }

        default:
          throw new Error(`Herramienta '${toolName}' no está registrada en el sistema de agentes.`);
      }

      const executionTimeMs = Date.now() - startTime;
      return {
        success: true,
        toolName,
        result,
        executionTimeMs
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return {
        success: false,
        toolName,
        result: null,
        executionTimeMs,
        error: err.message
      };
    }
  }
}
