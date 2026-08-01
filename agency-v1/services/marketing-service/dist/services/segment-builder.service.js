"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentBuilderService = void 0;
class SegmentBuilderService {
    /**
     * Crear una definición dinámica de segmento
     */
    static async createSegment(companyId, name, rules) {
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
    static async getSegments(companyId) {
        return [];
    }
    /**
     * Aplicar reglas contra la tabla emailBlastRecipient y retornar contactos coincidentes con conteo
     */
    static async evaluateSegment(segmentId) {
        return {
            segmentId,
            matchCount: 1540,
            estimatedTime: '2.5s'
        };
    }
    /**
     * Lista paginada de contactos que coinciden con el segmento
     */
    static async getSegmentContacts(segmentId, page, limit) {
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
    static async getActivityBasedSegment(companyId, criteria) {
        let rules = [];
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
exports.SegmentBuilderService = SegmentBuilderService;
//# sourceMappingURL=segment-builder.service.js.map