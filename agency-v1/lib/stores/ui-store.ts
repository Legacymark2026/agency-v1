"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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
    }),
    {
      name: 'lm-ui-state',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed 
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