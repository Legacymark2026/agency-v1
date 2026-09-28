import { IUserRepositoryPort } from "../core/ports/auth.ports";
import { UserDomain } from "../core/domain/auth.domain";
export declare class PrismaUserAdapter implements IUserRepositoryPort {
    save(user: UserDomain): Promise<UserDomain>;
    findByEmail(email: string): Promise<UserDomain | null>;
    findById(id: string): Promise<UserDomain | null>;
}
