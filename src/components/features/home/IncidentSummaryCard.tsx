import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import Animated, { FadeInDown } from 'react-native-reanimated'
import type { IncidentTicket } from '@/types/incident'

const CLOSED = ['resolved', 'closed', 'cancelled']

interface Props {
  tickets: IncidentTicket[]
}

export function IncidentSummaryCard({ tickets }: Props) {
  const openCount = tickets.filter((t) => !CLOSED.includes(t.status)).length
  const totalCount = tickets.length

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.label}>Sự cố đang xử lý</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{totalCount} tổng</Text>
        </View>
      </View>
      <Text style={styles.amount}>{openCount}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  totalBadge: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  totalText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  amount: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
})
