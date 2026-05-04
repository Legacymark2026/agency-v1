'use client';

import { useState } from 'react';
import { FileEdit, Send, Check, X, Loader2, Clock, ChevronDown, History } from 'lucide-react';
import { toast } from 'sonner';
import { createMessageDraft_Advanced, approveDraft_Advanced } from '@/actions/inbox-advanced';

const D = { bg: 'rgba(8,12,20,0.98)', card: 'rgba(15,23,42,0.8)', border: 'rgba(30,41,59,0.8)', textPrimary: '#cbd5e1', textMuted: '#475569', textDim: '#334155', teal: '#2dd4bf', tealBg: 'rgba(13,148,136,0.12)', tealBorder: 'rgba(13,148,136,0.3)', mono: 'monospace' };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:            { label: 'Draft',             color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  PENDING_APPROVAL: { label: 'Awaiting Approval', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  APPROVED:         { label: 'Approved',           color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
};

interface Draft { id: string; content: string; status: string; version: number; createdAt: Date | string; approvedBy?: string | null; }

interface DraftComposerProps {
  conversationId: string;
  currentUserId: string;
  userRole?: string;
  existingDrafts?: Draft[];
  onDraftApproved?: (content: string) => void;
}

export function DraftComposer({ conversationId, currentUserId, userRole = 'agent', existingDrafts = [], onDraftApproved }: DraftComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>(existingDrafts);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const canApprove = ['admin', 'super_admin', 'content_manager'].includes(userRole);

  const handleSaveDraft = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      const res = await createMessageDraft_Advanced(conversationId, content, currentUserId) as any;
      if (res?.success && res?.data) {
        const newDraft: Draft = { id: res.data.id, content: res.data.content, status: res.data.status, version: res.data.version, createdAt: res.data.createdAt };
        setDrafts(prev => [newDraft, ...prev]);
        setSelectedDraft(newDraft);
        toast.success('Draft saved');
      } else {
        toast.error(res?.error || 'Failed to save draft');
      }
    } finally { setIsSaving(false); }
  };

  const handleSubmitForApproval = async () => {
    if (!content.trim()) { toast.error('Write something first'); return; }
    setIsSubmitting(true);
    try {
      const res = await createMessageDraft_Advanced(conversationId, content, currentUserId, 'PENDING_APPROVAL') as any;
      if (res?.success && res?.data) {
        const newDraft: Draft = { id: res.data.id, content: res.data.content, status: 'PENDING_APPROVAL', version: res.data.version, createdAt: res.data.createdAt };
        setDrafts(prev => [newDraft, ...prev]);
        setSelectedDraft(newDraft);
        setContent('');
        toast.success('Submitted for approval');
      } else {
        toast.error(res?.error || 'Failed to submit');
      }
    } finally { setIsSubmitting(false); }
  };

  const handleApprove = async (draft: Draft) => {
    setApprovingId(draft.id);
    try {
      const res = await approveDraft_Advanced(draft.id, currentUserId, 'APPROVED') as any;
      if (res?.success) {
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'APPROVED' } : d));
        toast.success('Draft approved');
        if (onDraftApproved) onDraftApproved(draft.content);
      } else {
        toast.error(res?.error || 'Failed to approve');
      }
    } finally { setApprovingId(null); }
  };

  const handleReject = async (draft: Draft) => {
    setApprovingId(draft.id);
    try {
      const res = await approveDraft_Advanced(draft.id, currentUserId, 'REJECTED') as any;
      if (res?.success) {
        setDrafts(prev => prev.filter(d => d.id !== draft.id));
        toast.info('Draft rejected');
      } else {
        toast.error(res?.error || 'Failed to reject');
      }
    } finally { setApprovingId(null); }
  };

  const pendingCount = drafts.filter(d => d.status === 'PENDING_APPROVAL').length;

  return (
    <div style={{ borderTop: `1px solid ${D.border}`, background: D.bg }}>
      {/* Collapsed header */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: isOpen ? `1px solid ${D.border}` : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileEdit size={11} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#60a5fa', fontFamily: D.mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draft Composer</span>
          {pendingCount > 0 && (
            <span style={{ padding: '1px 6px', borderRadius: '99px', fontSize: '9px', fontWeight: 700, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontFamily: D.mono }}>
              {pendingCount} pending
            </span>
          )}
        </div>
        <ChevronDown size={12} style={{ color: D.textMuted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Textarea */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your draft reply here..."
            style={{ width: '100%', background: D.card, border: `1px solid ${D.border}`, borderRadius: '8px', padding: '10px', fontSize: '12px', color: D.textPrimary, outline: 'none', minHeight: '80px', resize: 'none', fontFamily: D.mono, boxSizing: 'border-box' }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleSaveDraft} disabled={isSaving || !content.trim()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px', borderRadius: '6px', border: `1px solid ${D.border}`, background: D.card, color: content.trim() ? D.textMuted : D.textDim, fontSize: '11px', cursor: content.trim() ? 'pointer' : 'not-allowed', fontFamily: D.mono }}>
              {isSaving ? <Loader2 size={11} className="animate-spin" /> : <FileEdit size={11} />} Save Draft
            </button>
            <button onClick={handleSubmitForApproval} disabled={isSubmitting || !content.trim()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.3)', background: content.trim() ? 'rgba(251,191,36,0.1)' : 'transparent', color: content.trim() ? '#fbbf24' : D.textDim, fontSize: '11px', fontWeight: 800, cursor: content.trim() ? 'pointer' : 'not-allowed', fontFamily: D.mono }}>
              {isSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Submit for Approval
            </button>
          </div>

          {/* Draft history toggle */}
          {drafts.length > 0 && (
            <button onClick={() => setShowHistory(h => !h)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: D.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: D.mono }}>
              <History size={11} /> {showHistory ? 'Hide' : 'Show'} draft history ({drafts.length})
            </button>
          )}

          {/* Draft history list */}
          {showHistory && drafts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {drafts.map(draft => {
                const cfg = STATUS_CONFIG[draft.status] || STATUS_CONFIG.DRAFT;
                return (
                  <div key={draft.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ padding: '1px 6px', borderRadius: '99px', fontSize: '9px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: D.mono }}>
                        {cfg.label} · v{draft.version}
                      </span>
                      <span style={{ fontSize: '9px', color: D.textDim, fontFamily: D.mono }}>
                        {!isNaN(new Date(draft.createdAt).getTime()) ? new Date(draft.createdAt).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: D.textMuted, fontFamily: D.mono, margin: '0 0 6px', lineHeight: 1.4, maxHeight: '48px', overflow: 'hidden' }}>{draft.content}</p>

                    {/* Load into textarea */}
                    <button onClick={() => { setContent(draft.content); setShowHistory(false); }}
                      style={{ fontSize: '10px', color: D.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: D.mono, padding: 0, marginRight: '8px' }}>
                      Load
                    </button>

                    {/* Approve/Reject (manager only) */}
                    {canApprove && draft.status === 'PENDING_APPROVAL' && (
                      <>
                        <button onClick={() => handleApprove(draft)} disabled={approvingId === draft.id}
                          style={{ fontSize: '10px', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontFamily: D.mono, padding: '0 8px 0 0', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          {approvingId === draft.id ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />} Approve
                        </button>
                        <button onClick={() => handleReject(draft)} disabled={approvingId === draft.id}
                          style={{ fontSize: '10px', color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: D.mono, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <X size={9} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
