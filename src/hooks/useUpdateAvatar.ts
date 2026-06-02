import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

/**
 * Cập nhật ảnh đại diện (avatarUrl) cho user hiện tại + toast feedback.
 * Gửi kèm fullName/phone hiện tại để BE không ghi đè rỗng.
 * Truyền null để xoá ảnh.
 */
export function useUpdateAvatar() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()

  return async (avatarUrl: string | null) => {
    await updateProfile({
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? null,
      avatarUrl,
    })
    showToast.success({
      message: avatarUrl ? 'Cập nhật ảnh đại diện thành công!' : 'Đã xoá ảnh đại diện',
    })
  }
}
