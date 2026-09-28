/**
 * Auth Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAuthUseCases, IUserRepositoryPort, ITokenSignerPort, IAuthEventPublisherPort, RegisterDTO } from "../ports/auth.ports";
import { UserDomain } from "../domain/auth.domain";
export declare class AuthUseCases implements IAuthUseCases {
    private readonly userRepo;
    private readonly tokenSigner;
    private readonly eventPublisher;
    constructor(userRepo: IUserRepositoryPort, tokenSigner: ITokenSignerPort, eventPublisher: IAuthEventPublisherPort);
    register(dto: RegisterDTO): Promise<UserDomain>;
    issueToken(user: UserDomain): string;
    verifyToken(token: string): any;
    checkAccess(user: UserDomain, requiredPermission: string): boolean;
}
