'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Tag, UserCheck, Zap, GitMerge, AlertTriangle, FileEdit, CheckCircle2, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAuditTrail_Advanced } from '@/actions/inbox-advanced';

interface AuditEntry {
  id: string;
  action: string;
  oldValue: any;
  newValue: any;
  createdAt: Date | string;
  actor: string;
}

const ACTION_CONFIG: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  message_sent:        { label: 'Message sent',       Icon: MessageSquare, color: '#2dd4bf', bg: 'rgba(13,148,136,0.15)' },
  message_deleted:     { label: 'Message deleted',    Icon: Trash2,        color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
  status_changed:      { label: 'Status changed',     Icon: CheckCircle2,  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  assigned_to_changed: { label: 'Reassigned',         Icon: UserCheck,     color: '#818cf8', bg: 'rgba(129,140,248,0.12)'},
  macro_executed:      { label: 'Macro executed',     Icon: Zap,           color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  tag_added:           { label: 'Tag added',          Icon: Tag,           color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  tag_removed:         { label: 'Tag removed',        Icon: Tag,           color: '#fb7185', bg: 'rgba(251,113,133,0.12)'},
  thread_merged:       { label: 'Conversations merged',Icon: GitMerge,     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'},
  sla_breached:        { label: 'SLA breached',       Icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
  draft_created:       { label: 'Draft created',      Icon: FileEdit,      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  draft_approved:      { label: 'Draft approved',     Icon: CheckCircle2,  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
};

const D = { border: 'rgba(30,41,59,0.8)', textPrimary: '#cbd5e1', textMuted: '#475569', textDim: '#334155', mono: 'monospace' };

function AuditItem({ entry }: { entry: AuditEntry }) {
  const cfg = ACTION_CONFIG[entry.action] ?? { label: entry.action.replace(/_/g, ' '), Icon: FileEdit, color: '#475569', bg: 'rgba(71,85,105,0.12)' };
  const Icon = cfg.Icon;
  const date = new Date(entry.createdAt);

  return (
    <div style={{ display: 'flex', gap: '10px', paddingBottom: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={12} style={{ color: cfg.color }} />
        </div>
        <div style={{ width: '1px', flex: 1, background: 'rgba(30,41,59,0.6)', marginTop: '4px' }} />
      </div>
      <div style={{ flex: 1, paddingTop: '3px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: D.textPrimary, fontFamily: D.mono }}>{cfg.label}</span>
          <span style={{ fontSize: '9px', color: D.textDim, fontFamily: D.mono, flexShrink: 0, marginLeft: '8px' }}>
            {!isNaN(date.getTime()) ? formatDistanceToNow(date, { addSuffix: true }) : 'N/A'}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: D.textMuted, fontFamily: D.mono }}>by {entry.actor}</span>
        {(entry.oldValue || entry.newValue) && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
            {entry.oldValue && typeof entry.oldValue === 'object' && Object.entries(entry.oldValue as Record<string,string>).map(([k, v]) => (
              <span key={`o-${k}`} style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontFamily: D.mono, background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}>
                {k}: {String(v)}
              </span>
            ))}
            {entry.newValue && typeof entry.newValue === 'object' && Object.entries(entry.newValue as Record<string,string>).map(([k, v]) => (
              <span key={`n-${k}`} style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontFamily: D.mono, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AuditTimeline({ conversationId }: { conversationId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limit, setLimit] = useState(20);

  const fetchLogs = useCallback(async (l: number) => {
    setIsLoading(true);
    try {
      const result = await getAuditTrail_Advanced(conversationId, l);
      if (Array.isArray(result)) setLogs(result as AuditEntry[]);
    } catch (e) { /* silent */ } finally { setIsLoading(false); }
  }, [conversationId]);

  useEffect(() => { fetchLogs(limit); }, [conversationId, limit, fetchLogs]);

  if (isLoading && logs.length === 0)
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '8px', color: D.textDim, fontSize: '11px', fontFamily: D.mono }}><Loader2 size={14} className="animate-spin" /> Loading...</div>;

  if (!isLoading && logs.length === 0)
    return <div style={{ textAlign: 'center', padding: '24px', color: D.textDim, fontSize: '11px', fontFamily: D.mono, fontStyle: 'italic' }}>No audit events yet.</div>;

  return (
    <div style={{ padding: '14px' }}>
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: D.textDim, fontFamily: D.mono }}>Audit Trail</span>
        <span style={{ padding: '1px 6px', borderRadius: '99px', fontSize: '9px', fontWeight: 700, background: 'rgba(13,148,136,0.1)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.25)', fontFamily: D.mono }}>{logs.length} events</span>
      </div>
      {logs.map((entry) => <AuditItem key={entry.id} entry={entry} />)}
      {logs.length >= limit && (
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px', borderRadius: '8px', border: '1px dashed rgba(30,41,59,0.9)', background: 'transparent', color: D.textMuted, fontSize: '11px', cursor: 'pointer', fontFamily: D.mono }}
          onClick={() => setLimit(l => l + 20)} disabled={isLoading}>
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />} Load more
        </button>
      )}
    </div>
  );
}
