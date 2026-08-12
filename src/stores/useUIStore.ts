"use client";

import { create } from "zustand";

/**
 * Global UI store — manages view-based navigation within the single-page app.
 * Since the system is constrained to a single "/" route, we simulate routing
 * through this store. Also holds sidebar state and modal context.
 */

export type View =
  | { name: "dashboard" }
  | { name: "builder"; formId: string }
  | { name: "responses"; formId: string }
  | { name: "response-detail"; formId: string; responseId: string }
  | { name: "filler"; formId: string };

interface UIState {
  view: View;
  sidebarCollapsed: boolean;
  setView: (view: View) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: { name: "dashboard" },
  sidebarCollapsed: false,
  setView: (view) => {
    set({ view });
    // Scroll to top on view change
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
