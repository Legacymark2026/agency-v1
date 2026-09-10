/**
 * Auth Service — Token Signer Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import jwt from "jsonwebtoken";
import { ITokenSignerPort } from "../core/ports/auth.ports";

export class JwtSignerAdapter implements ITokenSignerPort {
  constructor(private readonly secretOrKey: string = "secret-jwt-key") {}

  public sign(payload: Record<string, any>): string {
    return jwt.sign(payload, this.secretOrKey, { expiresIn: "1h" });
  }

  public verify(token: string): any {
    return jwt.verify(token, this.secretOrKey);
  }
}
