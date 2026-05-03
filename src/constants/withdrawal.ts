import type { WithdrawalStatus } from '@/types/withdrawal'

export const WD_STATUS_META: Record<WithdrawalStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Chờ duyệt',      color: '#92400E', bg: '#FEF3C7' },
  in_progress:  { label: 'Đang xử lý',     color: '#1E40AF', bg: '#DBEAFE' },
  paid:         { label: 'Đã chuyển',      color: '#065F46', bg: '#D1FAE5' },
  done:         { label: 'Hoàn tất',       color: '#374151', bg: '#E5E7EB' },
  rejected:     { label: 'Từ chối',        color: '#991B1B', bg: '#FEE2E2' },
  cancelled:    { label: 'Đã huỷ',         color: '#374151', bg: '#E5E7EB' },
  not_received: { label: 'Báo chưa nhận',  color: '#9A3412', bg: '#FFEDD5' },
}
