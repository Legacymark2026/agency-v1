/**
 * Auth Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAuthEventPublisherPort } from "../core/ports/auth.ports";
export declare class EventBusAuthAdapter implements IAuthEventPublisherPort {
    publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
