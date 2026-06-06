import { useEffect, useRef } from 'react'
import { useConfirm } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useDoctorProfile, useUpdateDoctorOnlineStatus } from '@/hooks/useDoctor'
import { getErrorMessage } from '@/utils/error'

/**
 * Doctor login → nếu profile `isOnline=false` → popup nhắc bật trạng thái.
 * User chọn "Bật online" → fire mutation luôn từ dialog, không bắt user vào
 * tab profile để toggle.
 *
 * - Chỉ fire 1 lần / session (`shownForUserRef` guard).
 * - Skip nếu profile chưa load (`isLoading`) hoặc user không phải doctor.
 * - Skip nếu doctor chưa approved (account chưa active, không có ý nghĩa bật).
 *
 * Mount ở root layout (sibling của GlobalRealtimeBridge).
 */
export function useDoctorOnlineNudge() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const isDoctor = user?.role === 'doctor'

  const { data: profile, isLoading } = useDoctorProfile(isDoctor)
  const { mutateAsync: updateOnline } = useUpdateDoctorOnlineStatus()

  // Guard theo userId thay vì boolean cố định — nếu user logout/login lại (vd
  // doctor A → doctor B), nudge fire lại 1 lần cho user mới.
  const shownForUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isDoctor || !user?.id) return
    if (isLoading || !profile) return
    if (profile.isOnline) return
    // Bỏ qua nếu doctor chưa được approved (chưa active để online).
    if (!profile.approvedAt) return
    if (shownForUserRef.current === user.id) return
    shownForUserRef.current = user.id

    let cancelled = false
    ;(async () => {
      const choice = await confirm.show({
        title: 'Bạn đang offline',
        message:
          'Để tiếp nhận yêu cầu hỗ trợ mới từ farmer/rancher, hãy bật trạng thái online.',
        icon: 'info',
        actions: [
          {
            key: 'GO_ONLINE',
            label: 'Bật online ngay',
            description: 'Bắt đầu nhận thông báo sự cố mới.',
            variant: 'primary',
          },
          {
            key: 'LATER',
            label: 'Để sau',
            description: 'Có thể bật lại từ tab Hồ sơ.',
            variant: 'cancel',
          },
        ],
      })
      if (cancelled || choice !== 'GO_ONLINE') return
      try {
        await updateOnline({ isOnline: true })
        showToast.success({ message: 'Đã bật trạng thái online' })
      } catch (err) {
        showToast.error({
          message: getErrorMessage(err, 'Không thể bật trạng thái. Vui lòng thử lại.'),
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isDoctor, user?.id, isLoading, profile, confirm, showToast, updateOnline])
}
