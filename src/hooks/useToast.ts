/**
 * Toast vs Notification policy (issue 2, 2026-06-05):
 *
 * ✅ Toast — DÙNG khi:
 *   - User's own action TRÊN CHÍNH SCREEN của họ thành công/thất bại
 *     (mutation onSuccess / onError, form validation error).
 *   - Network state change (offline / online).
 *   - Permission denied (image picker, camera, ...).
 *
 * ❌ Toast — KHÔNG dùng cho:
 *   - Cross-user event qua socket (vd doctor kê đơn → farmer nhận event).
 *     Các trường hợp này BE đã gửi `notification.created` → mobile render qua
 *     `<NotificationBanner>` (top of screen, có redirect_url).
 *   - System / worker event (auto-refund, AI resolved). Cũng đi qua notification.
 *
 * Mọi socket event handler chỉ nên `invalidateQueries`, KHÔNG `showToast`.
 *
 * @example
 * const { showToast } = useToast()
 * showToast.success({ message: 'Lưu thành công!' })
 * showToast.error({ message: 'Có lỗi xảy ra' })
 * showToast.networkOffline({})
 */
import { useMemo, createContext, useContext } from 'react'
import { ToastOptions } from '@/components/ui/Toast'

// Re-export context type để các hook khác dùng
interface AppContextT {
  showToast: (options: ToastOptions) => void
  hideToast: () => void
}

export const AppContext = createContext<AppContextT | undefined>(undefined)

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContext.Provider')
  return ctx
}

type QuickToastOptions = Omit<ToastOptions, 'type'>

export const useToast = () => {
  const { showToast: baseShowToast, hideToast } = useApp()

  const showToast = useMemo(() => {
    const fn = (options: ToastOptions) => baseShowToast(options)
    fn.success = (opt: QuickToastOptions) => baseShowToast({ ...opt, type: 'success' })
    fn.error = (opt: QuickToastOptions) => baseShowToast({ ...opt, type: 'error' })
    fn.info = (opt: QuickToastOptions) => baseShowToast({ ...opt, type: 'info' })
    fn.warning = (opt: QuickToastOptions) => baseShowToast({ ...opt, type: 'warning' })
    fn.networkOffline = (opt: QuickToastOptions) =>
      baseShowToast({ ...opt, type: 'network_offline', duration: 6000 })
    fn.networkOnline = (opt: QuickToastOptions) =>
      baseShowToast({ ...opt, type: 'network_online' })
    return fn
  }, [baseShowToast])

  return { showToast, hideToast }
}
