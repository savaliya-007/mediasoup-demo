import { create } from "zustand";

export const useStore = create((set) => ({
  user: null,
  room: null,
  users: [],
  publicMessages: [],
  privateMessages: {},

  setUser: (u) => set({ user: u }),
  setRoom: (r) => set({ room: r }),
  setUsers: (u) => set({ users: u }),
  addPublic: (m) => set((s) => ({ publicMessages: [...s.publicMessages, m] })),
}));
