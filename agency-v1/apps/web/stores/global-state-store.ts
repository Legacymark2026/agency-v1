/**
 * Global Application & Tenant State Store
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages active tenant profile, currency settings, notification count, and
 * active AI Agent status across Next.js pages.
 */

export interface GlobalState {
  companyId: string;
  companyName: string;
  currency: "COP" | "USD";
  unreadNotifications: number;
  isAiAgentActive: boolean;
  userRole: "ADMIN" | "MEMBER" | "OWNER";
}

let currentState: GlobalState = {
  companyId: "comp_demo_1",
  companyName: "Empresa Demo Colombia S.A.S.",
  currency: "COP",
  unreadNotifications: 3,
  isAiAgentActive: true,
  userRole: "ADMIN",
};

const listeners = new Set<() => void>();

export const globalStateStore = {
  getState: (): GlobalState => currentState,
  setState: (partial: Partial<GlobalState>): void => {
    currentState = { ...currentState, ...partial };
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
