import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import type { DeviceStatus, FarmerMilestoneStatus } from '@/types/farmerIot'

type Variant = {
  label: string
  bg: string
  fg: string
  dot: string
}

/**
 * Nhãn badge cho board trong ngữ cảnh milestone — đồng bộ với FE web
 * (xem docs/board-milestone-status-display.html mục 2 + 5).
 *
 * Mặc định dùng nhãn rút gọn theo `DeviceStatus`; có 2 rule override khi biết
 * trạng thái milestone đang chạy (xem `applyMilestoneOverride`).
 */
const VARIANTS: Record<DeviceStatus, Variant> = {
  available: { label: 'Sẵn sàng', bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' },
  purchase: { label: 'Chưa lắp đặt', bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6' },
  install: { label: 'Đang lắp đặt', bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B' },
  inactive: { label: 'Chờ giai đoạn bắt đầu', bg: '#F4F4F5', fg: '#52525B', dot: '#A1A1AA' },
  active: { label: 'Hoạt động', bg: '#ECFDF5', fg: '#047857', dot: '#10B981' },
  error: { label: 'Lỗi', bg: '#FEF2F2', fg: '#B91C1C', dot: '#EF4444' },
  revoked: { label: 'Đã thu hồi', bg: '#F4F4F5', fg: '#52525B', dot: '#A1A1AA' },
}

/** 2 ô override trong ma trận board × milestone — đồng bộ FE web. */
function applyMilestoneOverride(
  status: string,
  milestoneStatus: FarmerMilestoneStatus | undefined,
): Variant | null {
  if (!milestoneStatus) return null
  // inactive board + milestone đang chạy → đợi gói data đầu tiên
  if (status === 'inactive' && milestoneStatus === 'in_progress') {
    return { label: 'Chờ kích hoạt', bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B' }
  }
  // active board + milestone chưa tới lượt → board reuse, chờ giai đoạn
  if (status === 'active' && milestoneStatus === 'pending') {
    return { label: 'Chờ giai đoạn bắt đầu', bg: '#F4F4F5', fg: '#52525B', dot: '#A1A1AA' }
  }
  return null
}

interface Props {
  status: string | DeviceStatus
  /** Nếu có, áp dụng quy tắc override theo ma trận board × milestone. */
  milestoneStatus?: FarmerMilestoneStatus
}

export function DeviceStatusBadge({ status, milestoneStatus }: Props) {
  const override = applyMilestoneOverride(status, milestoneStatus)
  const variant: Variant =
    override ??
    (VARIANTS as Record<string, Variant>)[status] ?? {
      label: status || 'Không xác định',
      bg: '#F4F4F5',
      fg: '#52525B',
      dot: '#A1A1AA',
    }

  return (
    <View style={[styles.chip, { backgroundColor: variant.bg }]}>
      <View style={[styles.dot, { backgroundColor: variant.dot }]} />
      <Text style={[styles.text, { color: variant.fg }]}>{variant.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
  },
})
