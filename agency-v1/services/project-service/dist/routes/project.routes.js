"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRouter = void 0;
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const project_middleware_1 = require("../middlewares/project.middleware");
const zod_1 = require("zod");
const createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Project name is required"),
    description: zod_1.z.string().optional(),
});
exports.projectRouter = (0, express_1.Router)();
exports.projectRouter.get("/projects", project_controller_1.ProjectController.getProjects);
exports.projectRouter.post("/projects", (0, project_middleware_1.validateRequest)(createProjectSchema), project_controller_1.ProjectController.createProject);
//# sourceMappingURL=project.routes.js.map