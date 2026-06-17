import { create } from 'zustand';

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) => set({ projects: [...get().projects, project] }),
  updateProject: (id, data) =>
    set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...data } : p)) }),
  removeProject: (id) =>
    set({ projects: get().projects.filter((p) => p.id !== id) }),
}));