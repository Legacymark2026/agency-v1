import { Request, Response } from "express";
export declare class BookingController {
    static getBookingTypes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static createBookingType(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAvailableSlots(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static createAppointment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAppointments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAvailableSlotsTz(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static processNotes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
