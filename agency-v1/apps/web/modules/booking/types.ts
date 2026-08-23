/**
 * Tier-1 Enterprise Booking & Appointment Scheduling Types (Cal.com / Calendly Enterprise Standard)
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
  timeZone: string;
  meetingType: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON";
  meetingUrl: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";
  bookingMode: "ONE_ON_ONE" | "COLLECTIVE" | "GROUP";
  maxAttendees?: number;
  currentAttendees?: number;
  notes?: string;
  price?: number;
  currency?: string;
  paymentStatus?: "PAID" | "PENDING" | "FREE";
  organizerName?: string;
  hostMembers?: string[];
  routingAnswers?: Record<string, any>;
  createdAt: string;
}

export interface BookingTypeConfig {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  bufferMinutes: number;
  meetingType: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON";
  bookingMode: "ONE_ON_ONE" | "COLLECTIVE" | "GROUP";
  maxAttendees?: number;
  description: string;
  price: number;
  currency: string;
  requiresPayment: boolean;
  color: string;
  isActive: boolean;
  assignmentStrategy: "ROUND_ROBIN" | "SINGLE_HOST" | "COLLECTIVE";
  hosts: string[];
}

export interface SmartRoutingRule {
  id: string;
  name: string;
  question: string;
  options: { label: string; value: string; targetBookingTypeId: string; targetHostName: string }[];
}

export interface WeeklyScheduleDay {
  day: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
}

export interface BlockedDateOverride {
  id: string;
  date: string;
  reason: string;
  isFullDay: boolean;
}

export interface BookingRulesConfig {
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  defaultTimeZone: string;
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
  attendanceRate: number;
  upcomingTodayCount: number;
}
