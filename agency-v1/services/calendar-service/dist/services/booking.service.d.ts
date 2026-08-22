export interface CreateBookingTypeInput {
    companyId: string;
    name: string;
    slug: string;
    description?: string;
    durationMinutes?: number;
    bufferMinutes?: number;
    price?: number;
    currency?: string;
    locationType?: string;
    color?: string;
    assignmentStrategy?: string;
    requiresPayment?: boolean;
}
export interface CreateAppointmentInput {
    companyId: string;
    bookingTypeId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    startTime: Date;
    notes?: string;
}
export declare class BookingService {
    /**
     * List booking types for a company
     */
    static getBookingTypes(companyId: string): Promise<any>;
    /**
     * Create or update a booking type
     */
    static createBookingType(input: CreateBookingTypeInput): Promise<any>;
    /**
     * Calculate available time slots for a given date (YYYY-MM-DD)
     */
    static getAvailableSlots(companyId: string, bookingTypeId: string, dateStr: string): Promise<{
        startTime: string;
        endTime: string;
        available: boolean;
    }[]>;
    /**
     * Book an appointment with CRM Lead Auto-Sync & Notifications
     */
    static createAppointment(input: CreateAppointmentInput): Promise<any>;
    /**
     * List all appointments for a company
     */
    static getAppointments(companyId: string): Promise<any>;
}
