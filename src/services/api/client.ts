import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { CONFIG } from '@/constants/config'
import { tokenStorage } from '@/services/storage/tokenStorage'

let onUnauthorized: (() => void) | null = null
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export const apiClient = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

// Request: đính kèm access token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: tự động refresh token khi 401
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = await tokenStorage.getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')

      // Dùng axios trực tiếp để tránh interceptor loop
      const { data } = await axios.post(
        `${CONFIG.API_URL}/auth/refresh-token`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const { accessToken, refreshToken: newRefreshToken } = data.data

      await tokenStorage.setTokens(accessToken, newRefreshToken)

      refreshQueue.forEach((cb) => cb(accessToken))
      refreshQueue = []

      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch {
      refreshQueue = []
      onUnauthorized?.()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)
