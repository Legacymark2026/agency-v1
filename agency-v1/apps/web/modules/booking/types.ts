/**
 * Enterprise Booking & Appointment System Types (Calendly / Cal.com Tier-1 Standard)
 */

export interface AppointmentRecord {
  id: string;
  title: string;
  description?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  typeName: string;
  durationMinutes: number;
  bufferMinutes: number;
  startDate: string;
  endDate: string;
  meetingType: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON";
  meetingUrl: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";
  notes?: string;
  price?: number;
  currency?: string;
  paymentStatus?: "PAID" | "PENDING" | "FREE";
  organizerName?: string;
  createdAt: string;
}

export interface BookingTypeConfig {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  bufferMinutes: number;
  meetingType: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON";
  description: string;
  price: number;
  currency: string;
  requiresPayment: boolean;
  color: string;
  isActive: boolean;
  assignmentStrategy: "ROUND_ROBIN" | "SINGLE_HOST" | "COLLECTIVE";
}

export interface WeeklyScheduleDay {
  day: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
}

export interface BookingRulesConfig {
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  allowReschedule: boolean;
  allowCancellation: boolean;
  whatsappReminderTemplate: string;
  emailConfirmationTemplate: string;
}

export interface BookingMetricsReport {
  totalAppointments: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  attendanceRate: number; // %
  upcomingTodayCount: number;
}
