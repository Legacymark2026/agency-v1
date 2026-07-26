import { Router } from "express";
import { HrController } from "../controllers/hr.controller";
import { validateRequest } from "../middlewares/hr.middleware";
import { z } from "zod";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().optional(),
});

export const hrRouter = Router();

hrRouter.get("/employees", HrController.getEmployees);
hrRouter.post("/employees", validateRequest(createEmployeeSchema), HrController.createEmployee);
