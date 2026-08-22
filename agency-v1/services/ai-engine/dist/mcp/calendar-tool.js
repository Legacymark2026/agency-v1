"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarBookAppointmentTool = exports.calendarGetSlotsTool = void 0;
const CALENDAR_SERVICE_URL = process.env.CALENDAR_SERVICE_URL || "http://calendar-service:4008";
/**
 * MCP Tool: Consultar disponibilidad de horarios para citas.
 */
exports.calendarGetSlotsTool = {
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
    execute: async (input) => {
        try {
            const companyId = input.companyId || "default-company";
            const date = input.date || new Date().toISOString().split("T")[0];
            const url = `${CALENDAR_SERVICE_URL}/api/v1/booking/slots?companyId=${companyId}&bookingTypeId=${input.bookingTypeId}&date=${date}`;
            const res = await fetch(url);
            const json = (await res.json());
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
        }
        catch (err) {
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
exports.calendarBookAppointmentTool = {
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
    execute: async (input) => {
        try {
            const companyId = input.companyId || "default-company";
            const url = `${CALENDAR_SERVICE_URL}/api/v1/booking/appointments`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...input, companyId }),
            });
            const json = (await res.json());
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
        }
        catch (err) {
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
//# sourceMappingURL=calendar-tool.js.map