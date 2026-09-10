/**
 * Video Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IVideoEventPublisherPort } from "../core/ports/video.ports";

export class EventBusVideoAdapter implements IVideoEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
