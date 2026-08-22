export interface CreateEventInput {
    companyId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
}
export declare class CalendarService {
    /**
     * Obtener eventos de calendario por empresa
     */
    static getEvents(companyId: string, startDate?: Date, endDate?: Date): Promise<any>;
    /**
     * Crear evento en calendario con transacción atómica
     */
    static createEvent(input: CreateEventInput): Promise<any>;
}
