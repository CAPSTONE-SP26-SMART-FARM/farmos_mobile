import type { IncidentSeverity, TicketStatus } from '@/types/incident'

export const SEVERITY_META: Record<IncidentSeverity, {
  label: string; color: string; bg: string; desc: string
}> = {
  low:      { label: 'Thấp',         color: '#16A34A', bg: '#F0FDF4', desc: 'Ảnh hưởng nhỏ, không cấp bách' },
  medium:   { label: 'Trung bình',   color: '#CA8A04', bg: '#FEF9C3', desc: 'Cần xử lý sớm trong ngày' },
  high:     { label: 'Cao',          color: '#EA580C', bg: '#FFF7ED', desc: 'Ảnh hưởng lớn, cần xử lý ngay' },
  critical: { label: 'Nghiêm trọng', color: '#DC2626', bg: '#FEF2F2', desc: 'Khẩn cấp, nguy hiểm trực tiếp' },
}

// Label + màu sắc cho từng status — dùng chung cho badge (IncidentStatusBadge) + filter dropdown.
// Đồng bộ tuyệt đối với API: open | assigned | in_progress | resolved | closed | cancelled.
export const STATUS_META: Record<
  TicketStatus,
  { label: string; color: string; bg: string; desc: string }
> = {
  open: {
    label: 'Chờ tiếp nhận',
    color: '#15803D',
    bg: '#DCFCE7',
    desc: 'Sự cố vừa tạo, chưa có bác sĩ tiếp nhận',
  },
  assigned: {
    label: 'Đã tiếp nhận',
    color: '#7C3AED',
    bg: '#F5F3FF',
    desc: 'Bác sĩ đã tiếp nhận, chưa bắt đầu xử lý',
  },
  in_progress: {
    label: 'Đang xử lý',
    color: '#EA580C',
    bg: '#FFF7ED',
    desc: 'Bác sĩ đang xử lý sự cố',
  },
  resolved: {
    label: 'Chờ xác nhận',
    color: '#16A34A',
    bg: '#F0FDF4',
    desc: 'Bác sĩ đã đưa giải pháp, chờ người tạo xác nhận',
  },
  closed: {
    label: 'Hoàn tất',
    color: '#6B7280',
    bg: '#F3F4F6',
    desc: 'Người tạo đã xác nhận hoàn tất',
  },
  cancelled: {
    label: 'Đã huỷ',
    color: '#9CA3AF',
    bg: '#F9FAFB',
    desc: 'Sự cố đã bị huỷ',
  },
}
