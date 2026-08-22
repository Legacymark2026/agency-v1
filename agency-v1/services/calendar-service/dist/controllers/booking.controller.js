"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("../services/booking.service");
class BookingController {
    static async getBookingTypes(req, res) {
        try {
            const companyId = req.query.companyId || "default-company";
            const types = await booking_service_1.BookingService.getBookingTypes(companyId);
            return res.json({ success: true, data: types });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
    static async createBookingType(req, res) {
        try {
            const companyId = req.body.companyId || "default-company";
            const result = await booking_service_1.BookingService.createBookingType({ ...req.body, companyId });
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
    static async getAvailableSlots(req, res) {
        try {
            const companyId = req.query.companyId || "default-company";
            const bookingTypeId = req.query.bookingTypeId;
            const date = req.query.date || new Date().toISOString().split("T")[0];
            if (!bookingTypeId) {
                return res.status(400).json({ success: false, error: "bookingTypeId es requerido" });
            }
            const slots = await booking_service_1.BookingService.getAvailableSlots(companyId, bookingTypeId, date);
            return res.json({ success: true, data: slots });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
    static async createAppointment(req, res) {
        try {
            const companyId = req.body.companyId || "default-company";
            const appointment = await booking_service_1.BookingService.createAppointment({ ...req.body, companyId });
            return res.status(201).json({ success: true, data: appointment });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
    static async getAppointments(req, res) {
        try {
            const companyId = req.query.companyId || "default-company";
            const appointments = await booking_service_1.BookingService.getAppointments(companyId);
            return res.json({ success: true, data: appointments });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
exports.BookingController = BookingController;
//# sourceMappingURL=booking.controller.js.map