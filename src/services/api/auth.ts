import { apiClient } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth'
import type { ApiResponse } from '@/types/api'

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', body).then(r => r.data.data),

  register: (body: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', body).then(r => r.data.data),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then(r => r.data.data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
        refreshToken,
      })
      .then(r => r.data.data),
}
