"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRouter = void 0;
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const document_middleware_1 = require("../middlewares/document.middleware");
const zod_1 = require("zod");
const createProposalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    clientName: zod_1.z.string().optional(),
    totalAmount: zod_1.z.number().optional(),
    content: zod_1.z.string().optional(),
});
exports.documentRouter = (0, express_1.Router)();
exports.documentRouter.get("/proposals", document_controller_1.DocumentController.getProposals);
exports.documentRouter.post("/proposals", (0, document_middleware_1.validateRequest)(createProposalSchema), document_controller_1.DocumentController.createProposal);
//# sourceMappingURL=document.routes.js.map