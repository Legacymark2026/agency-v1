export interface RecipientTimezoneGroup {
    timezone: string;
    utcOffsetHours: number;
    scheduledTimeLocal: string;
    recipientsCount: number;
    recipients: any[];
}
export declare class TimezoneDeliveryService {
    /**
     * Agrupar destinatarios por zona horaria y calcular la hora de despacho en UTC para que coincida con las 9:00 AM local
     */
    static groupRecipientsByTimezone(recipients: any[], targetLocalHour?: number): RecipientTimezoneGroup[];
    private static getTimezoneOffsetHours;
}
