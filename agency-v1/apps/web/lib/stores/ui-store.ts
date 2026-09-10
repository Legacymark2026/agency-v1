"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentColor = 'teal' | 'violet' | 'blue' | 'amber' | 'rose' | 'emerald';
export type Density = 'compact' | 'normal' | 'comfortable';
export type FontType = 'inter' | 'roboto' | 'jetbrains' | 'geist';
export type BgTheme = 'slate' | 'amoled' | 'zinc' | 'indigo' | 'forest';
export type BorderRadius = 'sharp' | 'rounded' | 'pill';

export interface UIAppearanceConfig {
  accent: AccentColor;
  density: Density;
  font: FontType;
  bgTheme: BgTheme;
  borderRadius: BorderRadius;
  glassmorphism: boolean;
  highContrast: boolean;
  soundEffects: boolean;
  animationsEnabled: boolean;
  sidebarCollapsed: boolean;
}

interface UIState extends UIAppearanceConfig {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Appearance Setters
  setAccent: (accent: AccentColor) => void;
  setDensity: (density: Density) => void;
  setFont: (font: FontType) => void;
  setBgTheme: (bgTheme: BgTheme) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setGlassmorphism: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;

  // Preset & Bulk
  applyPreset: (preset: Partial<UIAppearanceConfig>) => void;
  resetToDefaults: () => void;
}

// Ultra-light synthesizer for haptic audio UI feedback (zero asset dependencies)
export function playUiSound(type: 'click' | 'success' | 'toggle' | 'reset' = 'click') {
  if (typeof window === 'undefined') return;
  try {
    const isEnabled = useUIStore.getState().soundEffects;
    if (!isEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'toggle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'reset') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // AudioContext autoplay restrictions or browser denial - fail silently
  }
}

const DEFAULT_UI_STATE: UIAppearanceConfig = {
  sidebarCollapsed: false,
  accent: 'teal',
  density: 'normal',
  font: 'inter',
  bgTheme: 'slate',
  borderRadius: 'sharp',
  glassmorphism: true,
  highContrast: false,
  soundEffects: true,
  animationsEnabled: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...DEFAULT_UI_STATE,

      toggleSidebar: () => set((state) => {
        const next = !state.sidebarCollapsed;
        playUiSound('toggle');
        return { sidebarCollapsed: next };
      }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setAccent: (accent) => {
        playUiSound('click');
        set({ accent });
      },

      setDensity: (density) => {
        playUiSound('click');
        set({ density });
      },

      setFont: (font) => {
        playUiSound('click');
        set({ font });
      },

      setBgTheme: (bgTheme) => {
        playUiSound('click');
        set({ bgTheme });
      },

      setBorderRadius: (borderRadius) => {
        playUiSound('click');
        set({ borderRadius });
      },

      setGlassmorphism: (glassmorphism) => {
        playUiSound('toggle');
        set({ glassmorphism });
      },

      setHighContrast: (highContrast) => {
        playUiSound('toggle');
        set({ highContrast });
      },

      setSoundEffects: (soundEffects) => {
        set({ soundEffects });
      },

      setAnimationsEnabled: (animationsEnabled) => {
        playUiSound('toggle');
        set({ animationsEnabled });
      },

      applyPreset: (preset) => {
        playUiSound('success');
        set((state) => ({ ...state, ...preset }));
      },

      resetToDefaults: () => {
        playUiSound('reset');
        set(DEFAULT_UI_STATE);
      },
    }),
    {
      name: 'lm-ui-state',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        accent: state.accent,
        density: state.density,
        font: state.font,
        bgTheme: state.bgTheme,
        borderRadius: state.borderRadius,
        glassmorphism: state.glassmorphism,
        highContrast: state.highContrast,
        soundEffects: state.soundEffects,
        animationsEnabled: state.animationsEnabled,
      }),
    }
  )
);

export function useSidebarCollapsed() {
  return useUIStore((state) => state.sidebarCollapsed);
}

export function useToggleSidebar() {
  return useUIStore((state) => state.toggleSidebar);
}