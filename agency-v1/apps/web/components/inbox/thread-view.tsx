'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Attachment { id: string; fileName: string; mediaUrl: string; mediaType: string; }
interface Message {
  id: string;
  content?: string | null;
  direction: string;
  createdAt: Date | string;
  senderId?: string | null;
  status?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  inReplyToId?: string | null;
  attachments?: Attachment[];
}

interface Thread {
  rootId: string;
  rootMessage: Message;
  replies: Thread[];
  expandedByDefault?: boolean;
}

// ─── Token palette ────────────────────────────────────────────────────────────
const D = { border: 'rgba(30,41,59,0.7)', textPrimary: '#cbd5e1', textMuted: '#475569', textDim: '#334155', teal: '#2dd4bf', tealBg: 'rgba(13,148,136,0.12)', mono: 'monospace' };

function getBubbleStyle(direction: string): React.CSSProperties {
  const isOut = direction === 'OUTBOUND';
  const isInternal = direction === 'INTERNAL';
  if (isInternal) return { background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#fbbf24', maxWidth: '85%' };
  if (isOut) return { background: 'linear-gradient(135deg,rgba(13,148,136,0.25),rgba(13,148,136,0.15))', border: '1px solid rgba(13,148,136,0.3)', color: '#e2e8f0', maxWidth: '85%' };
  return { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(30,41,59,0.8)', color: '#cbd5e1', maxWidth: '85%' };
}

function MessageBubble({ msg, depth = 0, currentUserId }: { msg: Message; depth?: number; currentUserId?: string }) {
  const isOut = msg.direction === 'OUTBOUND' || msg.senderId === currentUserId;
  const date = new Date(msg.createdAt);

  return (
    <div style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', paddingLeft: depth > 0 ? `${depth * 20}px` : 0 }}>
      <div style={{ ...getBubbleStyle(msg.direction), borderRadius: '12px', padding: '8px 12px', fontSize: '12px', fontFamily: D.mono }}>
        {msg.content && <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>}
        {(msg.attachments?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: msg.content ? '6px' : 0 }}>
            {msg.attachments!.map(a => (
              <a key={a.id} href={a.mediaUrl} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(30,41,59,0.9)', fontSize: '10px', color: D.textMuted, textDecoration: 'none' }}>
                <Paperclip size={9} /> {a.fileName}
              </a>
            ))}
          </div>
        )}
        {msg.mediaUrl && !msg.attachments?.length && (
          <a href={msg.mediaUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: D.teal }}>
            <Paperclip size={9} /> Attachment
          </a>
        )}
        <div style={{ fontSize: '9px', color: D.textDim, marginTop: '4px', textAlign: isOut ? 'right' : 'left' }}>
          {!isNaN(date.getTime()) ? format(date, 'HH:mm') : ''}
        </div>
      </div>
    </div>
  );
}

function ThreadNode({ thread, depth, currentUserId, expandedIds, toggle }: {
  thread: Thread; depth: number; currentUserId?: string;
  expandedIds: Set<string>; toggle: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(thread.rootId);
  const replyCount = countReplies(thread.replies);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <MessageBubble msg={thread.rootMessage} depth={depth} currentUserId={currentUserId} />

      {replyCount > 0 && (
        <div style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          <button
            onClick={() => toggle(thread.rootId)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: D.teal, background: D.tealBg, border: '1px solid rgba(13,148,136,0.25)', borderRadius: '99px', padding: '2px 8px', cursor: 'pointer', fontFamily: D.mono }}
          >
            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <MessageSquare size={10} />
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        </div>
      )}

      {isExpanded && thread.replies.map(child => (
        <ThreadNode key={child.rootId} thread={child} depth={depth + 1} currentUserId={currentUserId} expandedIds={expandedIds} toggle={toggle} />
      ))}
    </div>
  );
}

function countReplies(replies: Thread[]): number {
  return replies.length + replies.reduce((sum, r) => sum + countReplies(r.replies), 0);
}

function buildThreads(messages: Message[]): Thread[] {
  const map = new Map<string, Thread>();
  messages.forEach(m => map.set(m.id, { rootId: m.id, rootMessage: m, replies: [] }));

  const roots: Thread[] = [];
  messages.forEach(m => {
    if (m.inReplyToId && map.has(m.inReplyToId)) {
      map.get(m.inReplyToId)!.replies.push(map.get(m.id)!);
    } else {
      roots.push(map.get(m.id)!);
    }
  });
  return roots;
}

interface ThreadViewProps { messages: Message[]; currentUserId?: string; }

export function ThreadView({ messages, currentUserId }: ThreadViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const threads = buildThreads(messages);

  const toggle = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
      {threads.map(thread => (
        <ThreadNode key={thread.rootId} thread={thread} depth={0} currentUserId={currentUserId} expandedIds={expandedIds} toggle={toggle} />
      ))}
    </div>
  );
}
