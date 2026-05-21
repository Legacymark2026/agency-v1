import Redis from 'ioredis';

export interface TimelineState {
  clips: any[];
  audioTracks: any[];
  textOverlays: any[];
  colorGrades: any[];
  speedRamps: any[];
  soundLayers: any[];
  config: any;
}

export interface EditChange {
  id: string;
  action: string;
  description: string;
  beforeState: Partial<TimelineState>;
  afterState: Partial<TimelineState>;
  timestamp: string;
  undone: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: any[];
  toolResults?: any;
  timestamp: string;
}

export interface SessionContext {
  sessionId: string;
  projectId: string;
  companyId: string;
  currentPrompt?: string;
  lastAction?: string;
  createdAt: string;
}

const HISTORY_LIMIT = 15;
const CHAT_LIMIT = 10;
const TTL_SECONDS = 86400;

export class VideoSessionMemory {
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }

  private key(sessionId: string, segment: string): string {
    return `video:session:${sessionId}:${segment}`;
  }

  // ─── State Memory (Working Memory) ─────────────────────────────────────────
  async saveState(sessionId: string, timeline: TimelineState): Promise<void> {
    await this.redis.set(
      this.key(sessionId, 'state'),
      JSON.stringify(timeline),
      'EX',
      TTL_SECONDS,
    );
  }

  async getState(sessionId: string): Promise<TimelineState | null> {
    const raw = await this.redis.get(this.key(sessionId, 'state'));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // ─── History (Undo/Redo Stack) ─────────────────────────────────────────────
  async pushHistory(sessionId: string, change: EditChange): Promise<void> {
    await this.redis.lpush(
      this.key(sessionId, 'history'),
      JSON.stringify(change),
    );
    await this.redis.ltrim(this.key(sessionId, 'history'), 0, HISTORY_LIMIT - 1);
    await this.redis.expire(this.key(sessionId, 'history'), TTL_SECONDS);
  }

  async getHistory(sessionId: string): Promise<EditChange[]> {
    const raw = await this.redis.lrange(this.key(sessionId, 'history'), 0, -1);
    return raw.map(r => JSON.parse(r));
  }

  async undo(sessionId: string): Promise<EditChange | null> {
    const history = await this.getHistory(sessionId);
    const lastChange = history.find(h => !h.undone);
    if (!lastChange) return null;

    lastChange.undone = true;
    await this.redis.lset(
      this.key(sessionId, 'history'),
      history.indexOf(lastChange),
      JSON.stringify(lastChange),
    );

    return lastChange;
  }

  async redo(sessionId: string): Promise<EditChange | null> {
    const history = await this.getHistory(sessionId);
    const lastUndone = [...history].reverse().find(h => h.undone);
    if (!lastUndone) return null;

    lastUndone.undone = false;
    const idx = history.findIndex(h => h.id === lastUndone.id);
    await this.redis.lset(
      this.key(sessionId, 'history'),
      idx,
      JSON.stringify(lastUndone),
    );

    return lastUndone;
  }

  // ─── Chat Memory (Session Context) ─────────────────────────────────────────
  async pushMessage(sessionId: string, message: ChatMessage): Promise<void> {
    await this.redis.lpush(
      this.key(sessionId, 'chat'),
      JSON.stringify(message),
    );
    await this.redis.ltrim(this.key(sessionId, 'chat'), 0, CHAT_LIMIT - 1);
    await this.redis.expire(this.key(sessionId, 'chat'), TTL_SECONDS);
  }

  async getRecentMessages(sessionId: string): Promise<ChatMessage[]> {
    const raw = await this.redis.lrange(this.key(sessionId, 'chat'), 0, -1);
    return raw.map(r => JSON.parse(r)).reverse();
  }

  // ─── Session Context ───────────────────────────────────────────────────────
  async saveContext(sessionId: string, context: SessionContext): Promise<void> {
    await this.redis.set(
      this.key(sessionId, 'context'),
      JSON.stringify(context),
      'EX',
      TTL_SECONDS,
    );
  }

  async getContext(sessionId: string): Promise<SessionContext | null> {
    const raw = await this.redis.get(this.key(sessionId, 'context'));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  async clearSession(sessionId: string): Promise<void> {
    const keys = [
      this.key(sessionId, 'state'),
      this.key(sessionId, 'history'),
      this.key(sessionId, 'chat'),
      this.key(sessionId, 'context'),
    ];
    await this.redis.del(...keys);
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
