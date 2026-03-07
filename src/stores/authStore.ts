import { create } from 'zustand'
import { authApi } from '@/services/api/auth'
import { tokenStorage } from '@/services/storage/tokenStorage'
import type { User, LoginRequest, RegisterRequest } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const { user, tokens } = await authApi.login(credentials)
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      set({ user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const { user, tokens } = await authApi.register(data)
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      set({ user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout API error
    } finally {
      await tokenStorage.clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  fetchMe: async () => {
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true })
    } catch {
      await tokenStorage.clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  setUser: (user) => set({ user }),
}))
