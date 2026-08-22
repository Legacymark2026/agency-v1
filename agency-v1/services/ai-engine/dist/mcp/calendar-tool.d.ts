export interface GetSlotsInput {
    companyId?: string;
    bookingTypeId: string;
    date?: string;
}
export interface BookAppointmentInput {
    companyId?: string;
    bookingTypeId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    startTime: string;
    notes?: string;
}
/**
 * MCP Tool: Consultar disponibilidad de horarios para citas.
 */
export declare const calendarGetSlotsTool: {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            companyId: {
                type: string;
                description: string;
            };
            bookingTypeId: {
                type: string;
                description: string;
            };
            date: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (input: GetSlotsInput) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
        data: any;
        isError?: undefined;
    } | {
        isError: boolean;
        content: {
            type: string;
            text: string;
        }[];
        data?: undefined;
    }>;
};
/**
 * MCP Tool: Agendar cita automáticamente.
 */
export declare const calendarBookAppointmentTool: {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            companyId: {
                type: string;
                description: string;
            };
            bookingTypeId: {
                type: string;
                description: string;
            };
            customerName: {
                type: string;
                description: string;
            };
            customerEmail: {
                type: string;
                description: string;
            };
            customerPhone: {
                type: string;
                description: string;
            };
            startTime: {
                type: string;
                description: string;
            };
            notes: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (input: BookAppointmentInput) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
        appointment: any;
        isError?: undefined;
    } | {
        isError: boolean;
        content: {
            type: string;
            text: string;
        }[];
        appointment?: undefined;
    }>;
};
