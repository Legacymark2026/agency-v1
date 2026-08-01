"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimezoneDeliveryService = void 0;
class TimezoneDeliveryService {
    /**
     * Agrupar destinatarios por zona horaria y calcular la hora de despacho en UTC para que coincida con las 9:00 AM local
     */
    static groupRecipientsByTimezone(recipients, targetLocalHour = 9) {
        if (!recipients || recipients.length === 0)
            return [];
        const groupsMap = {};
        recipients.forEach((r) => {
            const tz = r.timezone || "America/Bogota";
            const offset = this.getTimezoneOffsetHours(tz);
            if (!groupsMap[tz]) {
                groupsMap[tz] = { offset, recipients: [] };
            }
            groupsMap[tz].recipients.push(r);
        });
        return Object.entries(groupsMap).map(([tz, data]) => {
            const now = new Date();
            const scheduledUtc = new Date(now);
            // Ajustar hora objetivo 9:00 AM en la zona horaria del destinatario
            scheduledUtc.setUTCHours(targetLocalHour - data.offset, 0, 0, 0);
            return {
                timezone: tz,
                utcOffsetHours: data.offset,
                scheduledTimeLocal: `${targetLocalHour}:00 AM`,
                recipientsCount: data.recipients.length,
                recipients: data.recipients
            };
        });
    }
    static getTimezoneOffsetHours(timezone) {
        const offsets = {
            "America/Bogota": -5,
            "America/Mexico_City": -6,
            "America/New_York": -4,
            "America/Argentina/Buenos_Aires": -3,
            "Europe/Madrid": 2,
            "Europe/London": 1
        };
        return offsets[timezone] !== undefined ? offsets[timezone] : -5;
    }
}
exports.TimezoneDeliveryService = TimezoneDeliveryService;
//# sourceMappingURL=timezone-delivery.service.js.map