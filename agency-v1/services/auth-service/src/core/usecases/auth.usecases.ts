/**
 * Auth Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IAuthUseCases,
  IUserRepositoryPort,
  ITokenSignerPort,
  IAuthEventPublisherPort,
  RegisterDTO,
} from "../ports/auth.ports";
import { UserDomain, isRoleAllowed } from "../domain/auth.domain";

export class AuthUseCases implements IAuthUseCases {
  constructor(
    private readonly userRepo: IUserRepositoryPort,
    private readonly tokenSigner: ITokenSignerPort,
    private readonly eventPublisher: IAuthEventPublisherPort
  ) {}

  public async register(dto: RegisterDTO): Promise<UserDomain> {
    const role = dto.role || "user";
    if (!isRoleAllowed(role)) throw new Error(`Rol no válido: ${role}`);

    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new Error(`El email ${dto.email} ya está registrado`);

    const user = new UserDomain(
      "usr_" + Math.random().toString(36).substring(2, 9),
      dto.email.toLowerCase(),
      role,
      dto.companyId,
      dto.permissions || []
    );

    const saved = await this.userRepo.save(user);

    await this.eventPublisher.publishEvent("auth.user.registered", {
      userId: saved.id,
      email: saved.email,
      role: saved.role,
      companyId: saved.companyId,
    });

    return saved;
  }

  public issueToken(user: UserDomain): string {
    return this.tokenSigner.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      permissions: user.permissions,
    });
  }

  public verifyToken(token: string): any {
    return this.tokenSigner.verify(token);
  }

  public checkAccess(user: UserDomain, requiredPermission: string): boolean {
    return user.hasPermission(requiredPermission);
  }
}
