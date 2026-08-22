"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hrRouter = void 0;
const express_1 = require("express");
const hr_controller_js_1 = require("../controllers/hr.controller.js");
const hr_middleware_js_1 = require("../middlewares/hr.middleware.js");
const zod_1 = require("zod");
const createEmployeeSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    email: zod_1.z.string().email("Invalid email format"),
    jobTitle: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    salary: zod_1.z.number().optional(),
});
exports.hrRouter = (0, express_1.Router)();
exports.hrRouter.get("/employees", hr_controller_js_1.HrController.getEmployees);
exports.hrRouter.post("/employees", (0, hr_middleware_js_1.validateRequest)(createEmployeeSchema), hr_controller_js_1.HrController.createEmployee);
const payroll_controller_js_1 = require("../controllers/payroll.controller.js");
exports.hrRouter.post("/payroll/calculate", payroll_controller_js_1.PayrollController.calculatePayroll);
//# sourceMappingURL=hr.routes.js.map