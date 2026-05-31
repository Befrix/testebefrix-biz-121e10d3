import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  commandOpen: boolean;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommand: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandOpen: false,
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommand: (commandOpen) => set({ commandOpen }),
}));
