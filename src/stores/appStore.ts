import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface AppState {
  theme: Theme
  isOnline: boolean

  setTheme: (theme: Theme) => void
  setOnline: (isOnline: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  isOnline: true,

  setTheme: (theme) => set({ theme }),
  setOnline: (isOnline) => set({ isOnline }),
}))
