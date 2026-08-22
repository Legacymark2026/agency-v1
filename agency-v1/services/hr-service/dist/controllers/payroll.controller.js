"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const payroll_service_js_1 = require("../services/payroll.service.js");
class PayrollController {
    /**
     * POST /api/v1/payroll/calculate
     */
    static async calculatePayroll(req, res, next) {
        try {
            const { employeeId, hoursWorked, ratePerHour, bonus } = req.body;
            if (!employeeId || hoursWorked === undefined || ratePerHour === undefined) {
                return res.status(400).json({ success: false, error: "employeeId, hoursWorked and ratePerHour are required" });
            }
            const result = await payroll_service_js_1.PayrollService.calculatePayroll({
                employeeId: String(employeeId),
                hoursWorked: Number(hoursWorked),
                ratePerHour: Number(ratePerHour),
                bonus: bonus ? Number(bonus) : undefined
            });
            res.json({ success: true, payroll: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PayrollController = PayrollController;
//# sourceMappingURL=payroll.controller.js.map