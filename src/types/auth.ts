// Mirror từ BE auth.model.ts + shared-user.model.ts

export type UserRole = 'admin' | 'owner' | 'manager' | 'farmer' | 'rancher' | 'doctor'

export type OtpType = 'REGISTER' | 'FORGOT_PASSWORD' | 'LOGIN' | 'DISABLE_2FA'

export interface User {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// POST /auth/otp
export interface SendOtpRequest {
  email: string
  type: OtpType
}

// POST /auth/register
export interface RegisterRequest {
  email: string
  fullName: string
  phone?: string | null
  password: string
  confirmPassword: string
  code: string
  role: 'owner' | 'doctor'
}

// POST /auth/login
export interface LoginRequest {
  email: string
  password: string
  totpCode?: string
  code?: string
}

// Response từ login / refresh-token
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// POST /auth/forgot-password
export interface ForgotPasswordRequest {
  email: string
  code: string
  newPassword: string
  confirmNewPassword: string
}
