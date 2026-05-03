"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentColor = 'teal' | 'violet' | 'blue' | 'amber' | 'rose' | 'emerald';
export type Density = 'compact' | 'normal' | 'comfortable';
export type FontType = 'inter' | 'roboto' | 'jetbrains' | 'geist';

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Appearance
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  
  density: Density;
  setDensity: (density: Density) => void;
  
  font: FontType;
  setFont: (font: FontType) => void;
  
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      setSidebarCollapsed: (collapsed) => set({ 
        sidebarCollapsed: collapsed 
      }),

      accent: 'teal',
      setAccent: (accent) => set({ accent }),

      density: 'normal',
      setDensity: (density) => set({ density }),

      font: 'inter',
      setFont: (font) => set({ font }),

      animationsEnabled: true,
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
    }),
    {
      name: 'lm-ui-state',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        accent: state.accent,
        density: state.density,
        font: state.font,
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