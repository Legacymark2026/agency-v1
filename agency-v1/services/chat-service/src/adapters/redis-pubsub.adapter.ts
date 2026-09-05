/**
 * Redis PubSub & Ephemeral State Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Facilitates multi-pod realtime synchronization and presence tracking.
 */
import Redis from "ioredis";
import { IRealtimePubSubPort } from "../core/ports/chat.ports";
import { PresenceStatus, RealtimeEnvelope, TypingIndicator } from "../core/domain/chat.domain";

export class RedisRealtimeAdapter implements IRealtimePubSubPort {
  private pub: Redis;
  private sub: Redis;
  private isSubscribed = false;

  constructor(redisUrl: string) {
    this.pub = new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: null });
    this.sub = new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: null });
  }

  public async publishChannelEvent(tenantId: string, channelId: string, envelope: RealtimeEnvelope): Promise<void> {
    const topic = `tenant:${tenantId}:channel:${channelId}`;
    await this.pub.publish(topic, JSON.stringify(envelope));
  }

  public async subscribeToTenant(tenantId: string, handler: (envelope: RealtimeEnvelope) => void): Promise<void> {
    const pattern = `tenant:${tenantId}:*`;
    await this.sub.psubscribe(pattern);

    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.sub.on("pmessage", (_pattern, _channel, message) => {
        try {
          const envelope: RealtimeEnvelope = JSON.parse(message);
          handler(envelope);
        } catch {
          // Ignore parse error
        }
      });
    }
  }

  public async setPresence(presence: PresenceStatus): Promise<void> {
    const key = `presence:${presence.companyId}:${presence.userId}`;
    await this.pub.set(key, JSON.stringify(presence), "EX", 300); // 5 min TTL
    await this.pub.publish(`tenant:${presence.companyId}:presence`, JSON.stringify({
      event: "presence.updated",
      tenantId: presence.companyId,
      payload: presence,
      timestamp: new Date().toISOString()
    }));
  }

  public async getPresence(companyId: string, userId: string): Promise<PresenceStatus | null> {
    const key = `presence:${companyId}:${userId}`;
    const data = await this.pub.get(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  public async setTyping(typing: TypingIndicator): Promise<void> {
    const topic = `tenant:${typing.companyId}:channel:${typing.channelId}`;
    await this.pub.publish(topic, JSON.stringify({
      event: "typing.updated",
      tenantId: typing.companyId,
      channelId: typing.channelId,
      payload: typing,
      timestamp: new Date().toISOString()
    }));
  }
}
