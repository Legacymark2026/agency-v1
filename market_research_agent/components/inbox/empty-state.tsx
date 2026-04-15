
import { MessageSquareDashed } from 'lucide-react';

export function EmptyState({ title = "Select a conversation", description = "Choose a conversation from the list to start chatting or view details." }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "32px", background: "transparent" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(30,41,59,0.6)", border: "1px solid rgba(30,41,59,0.9)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <MessageSquareDashed size={32} style={{ color: "#1e293b" }} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#334155", marginBottom: "8px", fontFamily: "monospace" }}>{title}</h3>
            <p style={{ fontSize: "12px", color: "#1e293b", maxWidth: "280px", lineHeight: "1.6", fontFamily: "monospace" }}>
                {description}
            </p>
        </div>
    );
}
