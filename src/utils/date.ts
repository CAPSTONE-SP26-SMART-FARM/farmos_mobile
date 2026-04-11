export const getCurrentYear = () => new Date().getFullYear()

/** "17:10" — giờ phút, trả '' nếu date không hợp lệ */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/** "11/4/2026, 17:10" — dùng cho notification/alert list */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "2 phút trước", "1 giờ trước"... */
export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString('vi-VN')
}
