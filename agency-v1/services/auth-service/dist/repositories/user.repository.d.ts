/**
 * services/auth-service/src/repositories/user.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User Repository Pattern Abstraction
 */
import { UserEntity } from "@models/user.model";
export interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
}
export declare class PrismaUserRepository implements IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
}
export declare const userRepository: PrismaUserRepository;
