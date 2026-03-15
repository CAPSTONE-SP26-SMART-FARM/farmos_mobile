import { apiClient } from './client'
import type {
  AuthTokens,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  SendOtpRequest,
  User,
} from '@/types/auth'

export const authApi = {
  // Gửi OTP (bước trước register hoặc forgot-password)
  sendOtp: (body: SendOtpRequest) =>
    apiClient
      .post<{ data: { message: string } }>('/auth/otp', body)
      .then((r) => r.data.data),

  // Đăng ký — cần OTP code
  register: (body: RegisterRequest) =>
    apiClient
      .post<{ data: User }>('/auth/register', body)
      .then((r) => r.data.data),

  // Đăng nhập — trả về tokens (không có user)
  login: (body: LoginRequest) =>
    apiClient
      .post<{ data: AuthTokens }>('/auth/login', body)
      .then((r) => r.data.data),

  // Lấy thông tin user hiện tại
  me: () =>
    apiClient
      .get<{ data: User }>('/auth/me')
      .then((r) => r.data.data),

  // Đăng xuất — cần gửi refreshToken lên để BE xóa
  logout: (refreshToken: string) =>
    apiClient
      .post('/auth/logout', { refreshToken })
      .then((r) => r.data),

  // Làm mới token
  refreshToken: (refreshToken: string) =>
    apiClient
      .post<{ data: AuthTokens }>('/auth/refresh-token', { refreshToken })
      .then((r) => r.data.data),

  // Đặt lại mật khẩu qua OTP
  forgotPassword: (body: ForgotPasswordRequest) =>
    apiClient
      .post<{ data: { message: string } }>('/auth/forgot-password', body)
      .then((r) => r.data.data),
}
