import type { IncidentSeverity, TicketStatus } from '@/types/incident'

export const SEVERITY_META: Record<IncidentSeverity, {
  label: string; color: string; bg: string; desc: string
}> = {
  low:      { label: 'Thấp',         color: '#16A34A', bg: '#F0FDF4', desc: 'Ảnh hưởng nhỏ, không cấp bách' },
  medium:   { label: 'Trung bình',   color: '#CA8A04', bg: '#FEF9C3', desc: 'Cần xử lý sớm trong ngày' },
  high:     { label: 'Cao',          color: '#EA580C', bg: '#FFF7ED', desc: 'Ảnh hưởng lớn, cần xử lý ngay' },
  critical: { label: 'Nghiêm trọng', color: '#DC2626', bg: '#FEF2F2', desc: 'Khẩn cấp, nguy hiểm trực tiếp' },
}

export const STATUS_META: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  open:        { label: 'Mở',              color: '#2563EB', bg: '#EFF6FF' },
  assigned:    { label: 'Đã giao',         color: '#7C3AED', bg: '#F5F3FF' },
  in_progress: { label: 'Đang xử lý',     color: '#EA580C', bg: '#FFF7ED' },
  resolved:    { label: 'Đã giải quyết',  color: '#16A34A', bg: '#F0FDF4' },
  closed:      { label: 'Đóng',           color: '#6B7280', bg: '#F9FAFB' },
  cancelled:   { label: 'Huỷ',            color: '#9CA3AF', bg: '#F9FAFB' },
}
