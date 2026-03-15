/**
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
