import { IRewardEventPublisherPort } from "../core/ports/goldneez.ports";
export class EventBusGoldneezAdapter implements IRewardEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
