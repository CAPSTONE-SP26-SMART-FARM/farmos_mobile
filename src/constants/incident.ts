import type { IncidentSeverity, TicketStatus } from '@/types/incident'

export const SEVERITY_META: Record<IncidentSeverity, {
  label: string; color: string; bg: string; desc: string
}> = {
  normal: { label: 'Bình thường', color: '#15803D', bg: '#DCFCE7', desc: 'Cần xử lý sớm, không khẩn cấp' },
  urgent: { label: 'Nghiêm trọng', color: '#DC2626', bg: '#FEE2E2', desc: 'Khẩn cấp, cần xử lý ngay lập tức' },
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
    color: '#047857',
    bg: '#D1FAE5',
    desc: 'Người tạo đã xác nhận hoàn tất',
  },
  cancelled: {
    label: 'Đã huỷ',
    color: '#B91C1C',
    bg: '#FEE2E2',
    desc: 'Sự cố đã bị huỷ',
  },
}
