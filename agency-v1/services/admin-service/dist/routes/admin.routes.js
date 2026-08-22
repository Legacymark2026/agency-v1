"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.get("/admin/kanban", admin_controller_1.AdminController.getKanban);
exports.adminRouter.get("/admin/overview", admin_controller_1.AdminController.getOverview);
//# sourceMappingURL=admin.routes.js.map