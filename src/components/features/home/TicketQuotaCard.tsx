import { useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Text } from '@/components/ui'
import { useTicketBalance } from '@/hooks/useIncident'

interface Props {
  delay?: number
}

export function TicketQuotaCard({ delay = 120 }: Props) {
  const { data, isLoading } = useTicketBalance()
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const totalRemaining = useMemo(
    () => items.reduce((sum, b) => sum + (b.total ?? 0), 0),
    [items],
  )
  const totalFromSub = useMemo(
    () => items.reduce((sum, b) => sum + (b.fromSubscription ?? 0), 0),
    [items],
  )
  const totalFromPurchased = useMemo(
    () => items.reduce((sum, b) => sum + (b.fromPurchased ?? 0), 0),
    [items],
  )

  const allOut = !isLoading && items.length > 0 && totalRemaining === 0

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name='ticket-confirmation' size={18} color='#15803D' />
          </View>
          <Text style={styles.headerTitle}>Quota sự cố</Text>
        </View>

        <View style={[styles.totalBadge, allOut && styles.totalBadgeEmpty]}>
          <Text style={[styles.totalBadgeText, allOut && styles.totalBadgeTextEmpty]}>
            Còn {totalRemaining} lượt
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size='small' color='#15803D' />
          <Text style={styles.loadingText}>Đang tải quota…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Chưa có gói dịch vụ nào áp dụng. Liên hệ chủ trang trại để được cấp quota.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Từ gói thuê bao</Text>
              <Text style={styles.summaryValue}>{totalFromSub}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Đã mua thêm</Text>
              <Text style={styles.summaryValue}>{totalFromPurchased}</Text>
            </View>
          </View>

          <View style={styles.list}>
            {items.map((b) => {
              const out = (b.total ?? 0) === 0
              return (
                <View key={b.categoryConfigId} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {b.categoryName}
                    </Text>
                  </View>
                  <View style={[styles.rowBadge, out && styles.rowBadgeEmpty]}>
                    <Text style={[styles.rowBadgeText, out && styles.rowBadgeTextEmpty]}>
                      {out ? 'Hết quota' : `Còn ${b.total}`}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>

          <TouchableOpacity
            style={[styles.cta, allOut && styles.ctaDisabled]}
            activeOpacity={0.8}
            onPress={() => router.push('/(app)/incident/create')}
            disabled={allOut}
          >
            <Text style={[styles.ctaText, allOut && styles.ctaTextDisabled]}>
              {allOut ? 'Đã hết quota báo cáo' : 'Báo cáo sự cố mới'}
            </Text>
            {!allOut && <Ionicons name='arrow-forward' size={16} color='#15803D' />}
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },

  totalBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalBadgeEmpty: { backgroundColor: '#FEE2E2' },
  totalBadgeText: { fontSize: 12, color: '#15803D', fontFamily: 'Inter_600SemiBold' },
  totalBadgeTextEmpty: { color: '#B91C1C' },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },

  emptyBox: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 13, lineHeight: 18, color: '#6B7280', fontFamily: 'Inter_400Regular' },

  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  summaryCol: { flex: 1 },
  summaryDivider: { width: 1, backgroundColor: '#BBF7D0', marginHorizontal: 8 },
  summaryLabel: {
    fontSize: 12,
    color: '#15803D',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    color: '#14532D',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 24,
  },

  list: { gap: 8, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rowLeft: { flex: 1, paddingRight: 8 },
  rowName: { fontSize: 14, color: '#111827', fontFamily: 'Inter_500Medium' },

  rowBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rowBadgeEmpty: { backgroundColor: '#FEF2F2' },
  rowBadgeText: { fontSize: 12, color: '#15803D', fontFamily: 'Inter_600SemiBold' },
  rowBadgeTextEmpty: { color: '#DC2626' },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
  },
  ctaDisabled: { backgroundColor: '#F3F4F6' },
  ctaText: { fontSize: 14, color: '#15803D', fontFamily: 'Inter_600SemiBold' },
  ctaTextDisabled: { color: '#9CA3AF' },
})
