import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/auth.middleware";
import { z } from "zod";

export function createAuthRouter(privateKey: string | null): Router {
  const router = Router();

  const loginSchema = z.object({
    body: z.object({
      email: z.string().email("Formato de email inválido"),
      password: z.string().min(1, "La contraseña es requerida"),
    }),
  });

  router.post("/login", validateRequest(loginSchema), (req, res, next) => {
    AuthController.login(req, res, next, privateKey);
  });

  router.get("/profile", (req, res, next) => {
    AuthController.getProfile(req, res, next);
  });

  return router;
}
