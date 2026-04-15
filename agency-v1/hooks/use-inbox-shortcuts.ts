
import { useEffect } from 'react';

interface UseInboxShortcutsProps {
    onSend?: () => void;
    onEscape?: () => void;
    onQuickReply?: () => void; // Trigger slash command
    disabled?: boolean;
}

export function useInboxShortcuts({
    onSend,
    onEscape,
    onQuickReply,
    disabled = false
}: UseInboxShortcutsProps) {
    useEffect(() => {
        if (disabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd/Ctrl + Enter (Send)
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                onSend?.();
                return;
            }

            // check for Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                onEscape?.();
                return;
            }

            // Check for Slash command (Quick Reply focus)
            // Only if not already typing in an input (unless it's the message input itself)
            // Ideally this is handled within the input component, but global shortcut could focus input and add '/'
            if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onQuickReply?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSend, onEscape, onQuickReply, disabled]);
}
