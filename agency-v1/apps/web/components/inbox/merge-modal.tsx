'use client';

import { useState, useEffect } from 'react';
import { GitMerge, Search, X, AlertTriangle, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { mergeConversations_Advanced, findDuplicateConversations_Advanced } from '@/actions/inbox-advanced';
import { formatDistanceToNow } from 'date-fns';
import { ChannelIcon } from './channel-icon';

const D = { bg: 'rgba(8,12,20,0.98)', card: 'rgba(15,23,42,0.8)', border: 'rgba(30,41,59,0.8)', textPrimary: '#cbd5e1', textMuted: '#475569', textDim: '#334155', teal: '#2dd4bf', tealBg: 'rgba(13,148,136,0.12)', tealBorder: 'rgba(13,148,136,0.3)', mono: 'monospace' };

interface Conversation { id: string; channel: string; status: string; lastMessageAt: Date | string; lastMessagePreview?: string | null; lead?: { name?: string | null } | null; }

interface MergeModalProps {
  primaryConversation: Conversation;
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MergeModal({ primaryConversation, companyId, onClose, onSuccess }: MergeModalProps) {
  const [duplicates, setDuplicates] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (!primaryConversation.lead) { setIsLoading(false); return; }
        const result = await findDuplicateConversations_Advanced(
          primaryConversation.id, primaryConversation.channel, companyId
        );
        setDuplicates(Array.isArray(result) ? result as Conversation[] : []);
      } catch { /* silent */ } finally { setIsLoading(false); }
    }
    load();
  }, [primaryConversation, companyId]);

  const handleMerge = async () => {
    if (!selected || !confirmed) return;
    setIsMerging(true);
    try {
      const res = await mergeConversations_Advanced(primaryConversation.id, selected.id, companyId);
      if ((res as any)?.success) {
        toast.success('Conversations merged successfully');
        onSuccess();
      } else {
        toast.error('Failed to merge conversations');
      }
    } catch (e: any) {
      toast.error(e.message || 'Merge failed');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'rgba(11,15,25,0.99)', border: `1px solid ${D.border}`, borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, color: D.textPrimary, fontSize: '14px', fontFamily: D.mono, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitMerge size={14} style={{ color: '#a78bfa' }} /> Merge Conversation
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.textMuted }}><X size={14} /></button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Primary conversation */}
          <div>
            <label style={{ fontSize: '9px', fontWeight: 800, color: D.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: D.mono, display: 'block', marginBottom: '6px' }}>Primary (keep)</label>
            <div style={{ background: D.tealBg, border: `1px solid ${D.tealBorder}`, borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChannelIcon channel={primaryConversation.channel as any} className="text-sm" />
              <span style={{ fontWeight: 700, fontSize: '12px', color: D.teal, fontFamily: D.mono }}>{primaryConversation.lead?.name || 'Unknown'}</span>
              <span style={{ fontSize: '10px', color: D.textMuted, fontFamily: D.mono, marginLeft: 'auto' }}>{primaryConversation.channel}</span>
            </div>
          </div>

          {/* Candidate list */}
          <div>
            <label style={{ fontSize: '9px', fontWeight: 800, color: D.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: D.mono, display: 'block', marginBottom: '6px' }}>
              Secondary (will be deleted after merge)
            </label>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '8px', color: D.textDim, fontSize: '11px', fontFamily: D.mono }}>
                <Loader2 size={12} className="animate-spin" /> Searching for duplicates...
              </div>
            ) : duplicates.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '16px', fontSize: '11px', color: D.textDim, fontFamily: D.mono, fontStyle: 'italic' }}>No duplicate conversations found for this lead.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {duplicates.map(conv => (
                  <button key={conv.id}
                    onClick={() => setSelected(conv)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: selected?.id === conv.id ? '1px solid rgba(167,139,250,0.5)' : `1px solid ${D.border}`, background: selected?.id === conv.id ? 'rgba(167,139,250,0.1)' : D.card, cursor: 'pointer', textAlign: 'left' }}
                  >
                    {selected?.id === conv.id && <Check size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />}
                    <ChannelIcon channel={conv.channel as any} className="text-sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '12px', color: D.textPrimary, fontFamily: D.mono, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lead?.name || 'Unknown'}</p>
                      <p style={{ fontSize: '10px', color: D.textMuted, fontFamily: D.mono, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessagePreview || 'No messages'}</p>
                    </div>
                    <span style={{ fontSize: '9px', color: D.textDim, fontFamily: D.mono, flexShrink: 0 }}>
                      {!isNaN(new Date(conv.lastMessageAt).getTime()) ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Warning + confirm */}
          {selected && (
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={12} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '10px', color: '#fb7185', fontFamily: D.mono, margin: 0, lineHeight: 1.5 }}>
                  All messages from <strong>{selected.lead?.name || 'selected conversation'}</strong> will move to the primary conversation. The secondary conversation will be permanently deleted.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ accentColor: '#f43f5e' }} />
                <span style={{ fontSize: '10px', color: '#fb7185', fontFamily: D.mono }}>I understand, proceed with merge</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${D.border}`, background: 'transparent', color: D.textMuted, fontSize: '12px', cursor: 'pointer', fontFamily: D.mono }}>
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={!selected || !confirmed || isMerging}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(167,139,250,0.4)', background: selected && confirmed ? 'rgba(167,139,250,0.15)' : 'transparent', color: selected && confirmed ? '#a78bfa' : D.textDim, fontSize: '12px', fontWeight: 800, cursor: selected && confirmed && !isMerging ? 'pointer' : 'not-allowed', fontFamily: D.mono, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isMerging ? <Loader2 size={12} className="animate-spin" /> : <GitMerge size={12} />}
              {isMerging ? 'Merging...' : 'Merge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
