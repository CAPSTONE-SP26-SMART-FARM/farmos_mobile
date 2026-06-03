import { Text } from '@/components/ui'
import { useDoctorTicketStats } from '@/hooks/useDoctorTicketStats'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface Props {
  delay?: number
}

export function DoctorTicketStatsCard({ delay = 150 }: Props) {
  const { stats, isLoading, isError } = useDoctorTicketStats()

  const totals = stats?.totals
  const totalAll = totals?.all ?? 0
  const totalActive = totals?.active ?? 0
  const totalEnded = totals?.ended ?? 0
  const completionPct = stats ? Math.round(stats.rates.completionRate * 100) : 0

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(25).stiffness(180)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/doctor-ticket-analytics')}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Thống kê sự cố</Text>
            <Text style={styles.subtitle}>Tổng hợp hoạt động xử lý sự cố</Text>
          </View>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Chi tiết</Text>
            <MaterialIcons name='chevron-right' size={20} color='#15803D' />
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color='#15803D' style={{ marginVertical: 16 }} />
        ) : isError ? (
          <Text style={styles.empty}>Không tải được thống kê. Thử lại sau.</Text>
        ) : !stats || totalAll === 0 ? (
          <Text style={styles.empty}>Bạn chưa nhận ticket nào.</Text>
        ) : (
          <>
            <View style={styles.row}>
              <Stat label='Tổng cộng' value={totalAll} color='#111827' />
              <View style={styles.divider} />
              <Stat label='Đang xử lý' value={totalActive} color='#15803D' />
              <View style={styles.divider} />
              <Stat label='Đã kết thúc' value={totalEnded} color='#4B5563' />
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, completionPct))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Tỉ lệ ticket đã hoàn thành: <Text style={styles.progressNum}>{completionPct}%</Text>
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.col}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: 15 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#15803D',
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    paddingVertical: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
  },
  progressWrap: {
    marginTop: 16,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#15803D',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  progressNum: {
    color: '#15803D',
    fontFamily: 'Inter_600SemiBold',
  },
})
