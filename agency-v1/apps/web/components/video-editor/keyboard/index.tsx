'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      for (const shortcut of shortcuts) {
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const DEFAULT_VIDEO_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: ' ',
    action: () => {},
    description: 'Play/Pause',
  },
  {
    key: 'z',
    ctrl: true,
    action: () => {},
    description: 'Deshacer',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: () => {},
    description: 'Rehacer',
  },
  {
    key: 's',
    ctrl: true,
    action: () => {},
    description: 'Guardar proyecto',
  },
  {
    key: 'Delete',
    action: () => {},
    description: 'Eliminar clip seleccionado',
  },
  {
    key: 'ArrowLeft',
    action: () => {},
    description: 'Retroceder 1 frame',
  },
  {
    key: 'ArrowRight',
    action: () => {},
    description: 'Avanzar 1 frame',
  },
  {
    key: 'ArrowUp',
    shift: true,
    action: () => {},
    description: 'Aumentar volumen',
  },
  {
    key: 'ArrowDown',
    shift: true,
    action: () => {},
    description: 'Disminuir volumen',
  },
  {
    key: 'c',
    action: () => {},
    description: 'Cortar en playhead',
  },
  {
    key: 'v',
    action: () => {},
    description: 'Herramienta selección',
  },
  {
    key: 't',
    action: () => {},
    description: 'Agregar texto',
  },
  {
    key: 'm',
    action: () => {},
    description: 'Toggle mute clip',
  },
  {
    key: 'f',
    action: () => {},
    description: 'Pantalla completa preview',
  },
  {
    key: 'Escape',
    action: () => {},
    description: 'Deseleccionar todo',
  },
];

export function KeyboardShortcutsHelp({ shortcuts = DEFAULT_VIDEO_SHORTCUTS }: { shortcuts?: KeyboardShortcut[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {shortcuts.map((shortcut, i) => (
        <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
          <span className="text-slate-400">{shortcut.description}</span>
          <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
            {shortcut.ctrl && 'Ctrl+'}
            {shortcut.shift && 'Shift+'}
            {shortcut.alt && 'Alt+'}
            {shortcut.key === ' ' ? 'Space' : shortcut.key}
          </kbd>
        </div>
      ))}
    </div>
  );
}
