"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const lead_controller_1 = require("../controllers/lead.controller");
const crm_middleware_1 = require("../middlewares/crm.middleware");
exports.leadRouter = (0, express_1.Router)();
const createLeadSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1, "companyId is required").optional(),
    name: zod_1.z.string().min(1, "name is required"),
    email: zod_1.z.string().email("invalid email format"),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    score: zod_1.z.number().int().optional()
});
exports.leadRouter.get("/leads", lead_controller_1.LeadController.getLeads);
exports.leadRouter.get("/leads/:id", lead_controller_1.LeadController.getLeadById);
exports.leadRouter.post("/leads", (0, crm_middleware_1.validateRequest)(createLeadSchema, "body"), lead_controller_1.LeadController.createLead);
//# sourceMappingURL=lead.routes.js.map