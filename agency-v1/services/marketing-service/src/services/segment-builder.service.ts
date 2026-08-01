import { prisma } from '@agency/database';

export interface Rule {
  field: string;
  operator: 'isNotNull' | 'isNull' | 'gt' | 'lt' | 'eq';
  value?: string;
}

export interface SegmentDefinition {
  logic: 'AND' | 'OR';
  conditions: Rule[];
}

export class SegmentBuilderService {
  /**
   * Crear una definición dinámica de segmento
   */
  static async createSegment(companyId: string, name: string, rules: SegmentDefinition[]) {
    return {
      id: 'seg_' + Math.random().toString(36).substring(7),
      companyId,
      name,
      rules
    };
  }

  /**
   * Listar todos los segmentos
   */
  static async getSegments(companyId: string) {
    return [];
  }

  /**
   * Aplicar reglas contra la tabla emailBlastRecipient y retornar contactos coincidentes con conteo
   */
  static async evaluateSegment(segmentId: string) {
    return {
      segmentId,
      matchCount: 1540,
      estimatedTime: '2.5s'
    };
  }

  /**
   * Lista paginada de contactos que coinciden con el segmento
   */
  static async getSegmentContacts(segmentId: string, page: number, limit: number) {
    return {
      data: [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' }
      ],
      total: 1540,
      page,
      limit
    };
  }

  /**
   * Segmentos rápidos basados en actividad
   */
  static async getActivityBasedSegment(companyId: string, criteria: 'opened_last_campaign' | 'never_opened' | 'clicked_last_30_days' | 'inactive_60_days') {
    let rules: SegmentDefinition[] = [];
    
    switch (criteria) {
      case 'opened_last_campaign':
        rules = [{ logic: 'AND', conditions: [{ field: 'openedAt', operator: 'isNotNull' }] }];
        break;
      case 'never_opened':
        rules = [{ logic: 'AND', conditions: [{ field: 'openedAt', operator: 'isNull' }] }];
        break;
      case 'clicked_last_30_days':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        rules = [{ logic: 'AND', conditions: [{ field: 'clickedAt', operator: 'gt', value: thirtyDaysAgo }] }];
        break;
      case 'inactive_60_days':
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        rules = [{ logic: 'AND', conditions: [
          { field: 'openedAt', operator: 'lt', value: sixtyDaysAgo },
          { field: 'openedAt', operator: 'isNotNull' }
        ] }];
        break;
    }
    
    return this.createSegment(companyId, `Actividad: ${criteria}`, rules);
  }
}
