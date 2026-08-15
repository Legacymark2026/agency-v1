const CALENDAR_SERVICE_URL = process.env.CALENDAR_SERVICE_URL || "http://calendar-service:4008";

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
export const calendarGetSlotsTool = {
  name: "calendar.getAvailableSlots",
  description: "Consulta los horarios libres disponibles para agendar una cita en una fecha determinada (YYYY-MM-DD).",
  parameters: {
    type: "object",
    properties: {
      companyId: { type: "string", description: "ID de la empresa cliente." },
      bookingTypeId: { type: "string", description: "ID del tipo de cita o servicio." },
      date: { type: "string", description: "Fecha en formato YYYY-MM-DD. Si se omite, se usa hoy." },
    },
    required: ["bookingTypeId"],
  },
  execute: async (input: GetSlotsInput) => {
    try {
      const companyId = input.companyId || "default-company";
      const date = input.date || new Date().toISOString().split("T")[0];
      const url = `${CALENDAR_SERVICE_URL}/api/v1/booking/slots?companyId=${companyId}&bookingTypeId=${input.bookingTypeId}&date=${date}`;

      const res = await fetch(url);
      const json = (await res.json()) as any;

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al consultar disponibilidad de horarios");
      }

      return {
        content: [
          {
            type: "text",
            text: `Horarios disponibles para ${date}: ${JSON.stringify(json.data)}`,
          },
        ],
        data: json.data,
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error al obtener disponibilidad de citas: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
};

/**
 * MCP Tool: Agendar cita automáticamente.
 */
export const calendarBookAppointmentTool = {
  name: "calendar.bookAppointment",
  description: "Agenda una nueva cita o reserva automáticamente para un cliente con fecha y hora específicas.",
  parameters: {
    type: "object",
    properties: {
      companyId: { type: "string", description: "ID de la empresa cliente." },
      bookingTypeId: { type: "string", description: "ID del tipo de servicio o cita." },
      customerName: { type: "string", description: "Nombre completo del cliente." },
      customerEmail: { type: "string", description: "Correo electrónico del cliente para confirmación." },
      customerPhone: { type: "string", description: "Teléfono o WhatsApp del cliente." },
      startTime: { type: "string", description: "Hora de inicio ISO-8601 de la cita seleccionada." },
      notes: { type: "string", description: "Notas adicionales o motivo de la consulta." },
    },
    required: ["bookingTypeId", "customerName", "customerEmail", "startTime"],
  },
  execute: async (input: BookAppointmentInput) => {
    try {
      const companyId = input.companyId || "default-company";
      const url = `${CALENDAR_SERVICE_URL}/api/v1/booking/appointments`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, companyId }),
      });
      const json = (await res.json()) as any;

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al agendar cita");
      }

      return {
        content: [
          {
            type: "text",
            text: `¡Cita agendada con éxito! ID: ${json.data.id}. Enlace de Google Meet: ${json.data.meetingUrl}`,
          },
        ],
        appointment: json.data,
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error al agendar la cita: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
};
