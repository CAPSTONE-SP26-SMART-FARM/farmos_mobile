import { create } from 'zustand'
import { authApi } from '@/services/api/auth'
import { profileApi, UpdateProfileRequest } from '@/services/api/profile'
import { tokenStorage } from '@/services/storage/tokenStorage'
import type { ForgotPasswordRequest, LoginRequest, RegisterRequest, User } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const tokens = await authApi.login(credentials)
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      const user = await authApi.me()
      set({ user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const user = await authApi.register(data)
      return user
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    const refreshToken = await tokenStorage.getRefreshToken()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // ignore
    } finally {
      await tokenStorage.clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  fetchMe: async () => {
    const token = await tokenStorage.getAccessToken()
    if (!token) { set({ user: null, isAuthenticated: false }); return }
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true })
    } catch {
      await tokenStorage.clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  forgotPassword: async (data) => {
    set({ isLoading: true })
    try {
      await authApi.forgotPassword(data)
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true })
    try {
      const user = await profileApi.update(data)
      set({ user })
    } finally {
      set({ isLoading: false })
    }
  },

  setUser: (user) => set({ user }),
}))
