'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Paperclip, Play, Pause, Volume2 } from 'lucide-react';
import { format } from 'date-fns';

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

function AudioPlayer({ audioSrc, isMe }: { audioSrc?: string; isMe?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Audio play error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && isPlaying && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '220px',
      maxWidth: '280px',
      padding: '8px 12px',
      borderRadius: '16px',
      border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
      background: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
      transition: 'all 0.2s',
      marginTop: '6px'
    }}>
      <audio
        ref={audioRef}
        src={audioSrc || ""}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onError={() => setIsPlaying(false)}
      />
      <button 
        onClick={togglePlay}
        style={{
          height: '32px',
          width: '32px',
          borderRadius: '55%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isMe ? '#2dd4bf' : '#0d9488',
          color: isMe ? '#0f172a' : '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'transform 0.1s'
        }}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
      </button>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div 
          onClick={(e) => {
            if (audioRef.current && audioRef.current.duration) {
              const rect = e.currentTarget.getBoundingClientRect();
              const per = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = per * audioRef.current.duration;
              setProgress(per * 100);
            }
          }}
          style={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '99px',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            background: isMe ? '#ffffff' : '#2dd4bf',
            width: `${progress}%`,
            transition: 'width 0.1s'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', opacity: 0.6, fontFamily: 'monospace' }}>
          <span>VOICE NOTE</span>
          <Volume2 size={10} style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  );
}

function renderMedia(url: string, name: string, type?: string | null, isMe?: boolean) {
  const cleanType = (type || '').toUpperCase();
  const cleanUrl = (url || '').toLowerCase();
  const cleanName = (name || '').toLowerCase();

  const isImage = cleanType === 'IMAGE' || cleanType.startsWith('IMAGE/') || /\.(png|jpe?g|gif|webp|svg)/i.test(cleanName + cleanUrl);
  const isAudio = cleanType === 'AUDIO' || cleanType.startsWith('AUDIO/') || /\.(mp3|wav|ogg|m4a|aac|webm|opus)/i.test(cleanName + cleanUrl) || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('data:audio') || cleanName.includes('voice-note');

  if (isImage) {
    return (
      <div style={{ marginTop: '8px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '300px' }}>
        <img 
          src={url} 
          alt={name || "Image"} 
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '200px', objectFit: 'cover' }} 
        />
        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer"
          style={{ position: 'absolute', inset: 0, display: 'flex', items: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', color: '#fff', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          View Full Image
        </a>
      </div>
    );
  }

  if (isAudio) {
    return <AudioPlayer audioSrc={url} isMe={isMe} />;
  }

  // Default document / file link
  return (
    <a href={url} target="_blank" rel="noreferrer" download={name || 'archivo'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(30,41,59,0.9)', fontSize: '11px', color: '#e2e8f0', textDecoration: 'none', marginTop: '6px', transition: 'all 0.2s' }}>
      <Paperclip size={12} /> <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'Descargar Documento'}</span>
    </a>
  );
}

function MessageBubble({ msg, depth = 0, currentUserId }: { msg: Message; depth?: number; currentUserId?: string }) {
  const isOut = msg.direction === 'OUTBOUND' || msg.senderId === currentUserId;
  const date = new Date(msg.createdAt);

  return (
    <div style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', paddingLeft: depth > 0 ? `${depth * 20}px` : 0 }}>
      <div style={{ ...getBubbleStyle(msg.direction), borderRadius: '12px', padding: '8px 12px', fontSize: '12px', fontFamily: D.mono }}>
        {msg.content && <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>}
        {(msg.attachments?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: msg.content ? '6px' : 0 }}>
            {msg.attachments!.map(a => (
              <div key={a.id}>
                {renderMedia(a.mediaUrl, a.fileName, a.mediaType, isOut)}
              </div>
            ))}
          </div>
        )}
        {msg.mediaUrl && !msg.attachments?.length && (
          <div>
            {renderMedia(msg.mediaUrl, 'Attachment', msg.mediaType, isOut)}
          </div>
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
