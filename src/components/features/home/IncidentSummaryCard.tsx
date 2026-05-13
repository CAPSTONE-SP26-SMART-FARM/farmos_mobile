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
      <View style={styles.col}>
        <Text style={styles.label}>Tổng số sự cố</Text>
        <Text style={styles.value}>{totalCount}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.col}>
        <Text style={styles.label}>Đang chờ xử lý</Text>
        <Text style={styles.value}>{openCount}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  col: { flex: 1 },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  label: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
})
