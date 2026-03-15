import { apiClient } from './client'
import type { User } from '@/types/auth'

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string | null
  avatarUrl?: string | null
}

export const profileApi = {
  // POST /profile/update
  // BE yêu cầu avatarUrl phải là string | null, không được undefined
  update: (body: UpdateProfileRequest) =>
    apiClient
      .post<{ data: User }>('/profile/update', {
        fullName: body.fullName,
        phone: body.phone ?? null,
        avatarUrl: body.avatarUrl ?? null, // luôn gửi null thay vì undefined
      })
      .then((r) => r.data.data),
}
