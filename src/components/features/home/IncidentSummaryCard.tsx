import { useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { IncidentStatusFilter } from '@/components/features/incident/IncidentStatusFilter'
import Animated, { FadeInDown } from 'react-native-reanimated'
import type { IncidentTicket } from '@/types/incident'

const CLOSED = ['resolved', 'closed', 'cancelled']

type DateFilter = 'today' | '7days' | '30days'

const DATE_OPTIONS: readonly { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7days', label: '7 ngày gần đây' },
  { value: '30days', label: '30 ngày gần đây' },
]

function isWithinDateRange(createdAt: string, filter: DateFilter): boolean {
  const date = new Date(createdAt)
  const now = new Date()
  if (filter === 'today') return date.toDateString() === now.toDateString()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  if (filter === '7days') return diffDays <= 7
  return diffDays <= 30
}

interface Props {
  tickets: IncidentTicket[]
}

export function IncidentSummaryCard({ tickets }: Props) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')

  const filtered = useMemo(
    () => tickets.filter((t) => isWithinDateRange(t.createdAt, dateFilter)),
    [tickets, dateFilter],
  )
  const openCount = filtered.filter((t) => !CLOSED.includes(t.status)).length
  const totalCount = filtered.length

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sự cố</Text>
        <IncidentStatusFilter
          value={dateFilter}
          options={DATE_OPTIONS}
          onChange={setDateFilter}
          title='Lọc theo thời gian'
        />
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Tổng số sự cố</Text>
          <Text style={styles.value}>{totalCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.col}>
          <Text style={styles.label}>Đang chờ xử lý</Text>
          <Text style={styles.value}>{openCount}</Text>
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
  headerTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  row: { flexDirection: 'row' },
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
