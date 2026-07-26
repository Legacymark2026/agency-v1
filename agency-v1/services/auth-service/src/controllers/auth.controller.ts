import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction, privateKey: string | null) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password required" });
      }

      const result = await AuthService.login(
        {
          email,
          password,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
        privateKey
      );

      res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      if (err.message === "ACCOUNT_DEACTIVATED") {
        return res.status(403).json({ success: false, error: "Account deactivated" });
      }
      next(err);
    }
  }

  /**
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const profile = await AuthService.getUserProfile(userId);
      res.json({ success: true, user: profile });
    } catch (err: any) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      next(err);
    }
  }
}
