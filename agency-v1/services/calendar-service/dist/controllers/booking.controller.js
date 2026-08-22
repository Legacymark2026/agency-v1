"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    static async getAvailableSlotsTz(req, res) {
        try {
            const companyId = req.query.companyId || "default-company";
            const bookingTypeId = req.query.bookingTypeId;
            const date = req.query.date || new Date().toISOString().split("T")[0];
            const timezone = req.query.timezone || "UTC";
            if (!bookingTypeId) {
                return res.status(400).json({ success: false, error: "bookingTypeId es requerido" });
            }
            const slots = await booking_service_1.BookingService.getCrossTimezoneSlots(companyId, bookingTypeId, date, timezone);
            return res.json({ success: true, data: slots });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
    static async processNotes(req, res) {
        try {
            const appointmentId = String(req.params.appointmentId || "");
            const companyId = String(req.body.companyId || "default-company");
            const notes = String(req.body.notes || "");
            if (!notes) {
                return res.status(400).json({ success: false, error: "notes es requerido" });
            }
            const { NotesProcessorService } = await Promise.resolve().then(() => __importStar(require("../services/notes-processor.service")));
            const tasks = await NotesProcessorService.processMeetingNotes(appointmentId, companyId, notes);
            return res.json({ success: true, appointmentId, tasksCount: tasks.length, tasks });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
exports.BookingController = BookingController;
//# sourceMappingURL=booking.controller.js.map