import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  darkMode: true,
  activeModal: null,          // 'newProject' | 'taskDetail' | null
  activeTaskId: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  openModal: (modal, taskId = null) => set({ activeModal: modal, activeTaskId: taskId }),
  closeModal: () => set({ activeModal: null, activeTaskId: null }),
}));