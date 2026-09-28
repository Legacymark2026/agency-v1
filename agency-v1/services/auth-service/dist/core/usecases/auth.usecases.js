"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCases = void 0;
const auth_domain_1 = require("../domain/auth.domain");
class AuthUseCases {
    userRepo;
    tokenSigner;
    eventPublisher;
    constructor(userRepo, tokenSigner, eventPublisher) {
        this.userRepo = userRepo;
        this.tokenSigner = tokenSigner;
        this.eventPublisher = eventPublisher;
    }
    async register(dto) {
        const role = dto.role || "user";
        if (!(0, auth_domain_1.isRoleAllowed)(role))
            throw new Error(`Rol no válido: ${role}`);
        const existing = await this.userRepo.findByEmail(dto.email);
        if (existing)
            throw new Error(`El email ${dto.email} ya está registrado`);
        const user = new auth_domain_1.UserDomain("usr_" + Math.random().toString(36).substring(2, 9), dto.email.toLowerCase(), role, dto.companyId, dto.permissions || []);
        const saved = await this.userRepo.save(user);
        await this.eventPublisher.publishEvent("auth.user.registered", {
            userId: saved.id,
            email: saved.email,
            role: saved.role,
            companyId: saved.companyId,
        });
        return saved;
    }
    issueToken(user) {
        return this.tokenSigner.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            permissions: user.permissions,
        });
    }
    verifyToken(token) {
        return this.tokenSigner.verify(token);
    }
    checkAccess(user, requiredPermission) {
        return user.hasPermission(requiredPermission);
    }
}
exports.AuthUseCases = AuthUseCases;
//# sourceMappingURL=auth.usecases.js.map