import type { DoctorType, RegistrationStatus } from '@/types/doctor'

export const DOCTOR_TYPE_LABEL: Record<DoctorType, string> = {
  internal: 'Bác sĩ nội bộ',
  partner: 'Bác sĩ hợp tác',
  coordinator: 'Bác sĩ điều phối',
}

export const DOCTOR_TYPES = (Object.keys(DOCTOR_TYPE_LABEL) as DoctorType[]).map(
  (value) => ({ value, label: DOCTOR_TYPE_LABEL[value] }),
)

export const REGISTRATION_STATUS_CONFIG: Record<RegistrationStatus, { label: string; bg: string; color: string }> = {
  approved: { label: 'Đã phê duyệt', bg: '#D1FAE5', color: '#065F46' },
  pending:  { label: 'Chờ phê duyệt', bg: '#FEF3C7', color: '#92400E' },
  rejected: { label: 'Từ chối',       bg: '#FEE2E2', color: '#991B1B' },
  suspended:{ label: 'Tạm khóa',      bg: '#F3F4F6', color: '#6B7280' },
}
