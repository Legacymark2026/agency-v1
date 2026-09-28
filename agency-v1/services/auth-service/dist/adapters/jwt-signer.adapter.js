"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtSignerAdapter = void 0;
/**
 * Auth Service — Token Signer Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtSignerAdapter {
    secretOrKey;
    constructor(secretOrKey = "secret-jwt-key") {
        this.secretOrKey = secretOrKey;
    }
    sign(payload) {
        return jsonwebtoken_1.default.sign(payload, this.secretOrKey, { expiresIn: "1h" });
    }
    verify(token) {
        return jsonwebtoken_1.default.verify(token, this.secretOrKey);
    }
}
exports.JwtSignerAdapter = JwtSignerAdapter;
//# sourceMappingURL=jwt-signer.adapter.js.map