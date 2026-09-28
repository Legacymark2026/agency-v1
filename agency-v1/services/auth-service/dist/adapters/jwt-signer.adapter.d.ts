import { ITokenSignerPort } from "../core/ports/auth.ports";
export declare class JwtSignerAdapter implements ITokenSignerPort {
    private readonly secretOrKey;
    constructor(secretOrKey?: string);
    sign(payload: Record<string, any>): string;
    verify(token: string): any;
}
