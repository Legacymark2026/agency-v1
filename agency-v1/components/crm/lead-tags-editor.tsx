"use client";

import { useState, useTransition } from "react";
import { updateLead } from "@/actions/crm";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props { leadId: string; initialTags: string[]; }

export function LeadTagsEditor({ leadId, initialTags }: Props) {
    const [tags, setTags] = useState<string[]>(initialTags);
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");

    async function handleAddTag(e: React.FormEvent) {
        e.preventDefault();
        const newTag = inputValue.trim().toUpperCase();
        if (!newTag || tags.includes(newTag)) { setInputValue(""); setIsEditing(false); return; }
        const prevTags = [...tags];
        const newTags = [...tags, newTag];
        setTags(newTags); setInputValue(""); setIsEditing(false);
        startTransition(async () => {
            const res = await updateLead(leadId, { tags: newTags });
            if (res.error) { setTags(prevTags); toast?.error?.(res.error); }
        });
    }

    async function handleRemoveTag(tagToRemove: string) {
        const prevTags = [...tags];
        const newTags = tags.filter(t => t !== tagToRemove);
        setTags(newTags);
        startTransition(async () => {
            const res = await updateLead(leadId, { tags: newTags });
            if (res.error) { setTags(prevTags); toast?.error?.(res.error); }
        });
    }

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            {tags.map((tag) => (
                <span key={tag}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 800,
                        color: "#2dd4bf", background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.3)",
                        fontFamily: "monospace", opacity: isPending ? 0.6 : 1, transition: "all 0.15s",
                    }}>
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} disabled={isPending}
                        style={{ color: "#0d9488", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0, lineHeight: 1 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#0d9488"; }}>
                        <X style={{ width: "10px", height: "10px" }} />
                    </button>
                </span>
            ))}

            {isEditing ? (
                <form onSubmit={handleAddTag} style={{ display: "flex" }}>
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleAddTag} autoFocus placeholder="NUEVO_TAG..." disabled={isPending}
                        style={{
                            padding: "3px 10px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace",
                            textTransform: "uppercase", width: "110px",
                            background: "rgba(15,23,42,0.8)", border: "1px solid rgba(13,148,136,0.5)",
                            borderRadius: "99px", color: "#2dd4bf", outline: "none",
                        }} />
                </form>
            ) : (
                <button onClick={() => setIsEditing(true)} disabled={isPending}
                    style={{
                        width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px dashed rgba(30,41,59,0.9)", color: "#334155", background: "none", cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.5)"; (e.currentTarget as HTMLElement).style.color = "#2dd4bf"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,0.9)"; (e.currentTarget as HTMLElement).style.color = "#334155"; }}>
                    {isPending ? <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" /> : <Plus style={{ width: "12px", height: "12px" }} />}
                </button>
            )}
        </div>
    );
}
