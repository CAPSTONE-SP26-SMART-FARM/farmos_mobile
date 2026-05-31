import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { icons } from '@/constants/icon'
import { useDoctorProfile } from '@/hooks/useDoctor'
import Animated, { FadeInDown } from 'react-native-reanimated'

const IncidentIcon = icons.incidentSvg
const ClockIcon = icons.clockSvg

interface Props {
  isApproved: boolean
  activeCount: number
}

export function DoctorStatusCard({ isApproved, activeCount }: Props) {
  const { data: profile } = useDoctorProfile()
  const isOnline = profile?.isOnline ?? false

  const statusLabel = !isApproved
    ? 'Chưa phê duyệt'
    : isOnline
    ? 'Đang nhận sự cố'
    : 'Offline'

  const statusColor = !isApproved
    ? '#DB7706'
    : isOnline
    ? '#15803D'
    : '#DC2828'

  const subText = !isApproved
    ? 'Vào tab Hồ sơ để hoàn tất đăng ký'
    : isOnline
    ? `${activeCount} sự cố đang xử lý`
    : 'Bật online trong tab Hồ sơ'

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(150).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <Text style={styles.sectionTitle}>Lịch hoạt động</Text>
      <View style={styles.itemRow}>
        <View style={styles.iconWrapper}>
          <IncidentIcon width={22} height={22} color='#15803D' />
        </View>
        <View style={styles.content}>
          <Text style={styles.nameText}>
            {profile ? `BS. ${profile.specialization ?? 'Bác sĩ'}` : 'Hồ sơ của bạn'}
          </Text>
          <Text style={styles.periodText}>{subText}</Text>
          <View style={styles.deadlineRow}>
            <ClockIcon width={14} height={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingTop: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 14,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: -5,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  nameText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  periodText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
})
