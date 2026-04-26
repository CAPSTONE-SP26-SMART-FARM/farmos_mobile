import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { icons } from '@/constants/icon'
import Animated, { FadeInDown } from 'react-native-reanimated'
import type { IncidentTicket } from '@/types/incident'

const CalendarIcon = icons.calendarBgSvg
const ClockIcon = icons.clockSvg

const DONE_STATUSES = ['resolved', 'closed']

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function formatToday() {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface Props {
  userName: string
  tickets: IncidentTicket[]
  delay?: number
}

export function TodayScheduleCard({ userName, tickets, delay = 150 }: Props) {
  const todayTickets = tickets.filter((t) => isToday(t.createdAt))
  const resolvedCount = todayTickets.filter((t) => DONE_STATUSES.includes(t.status)).length
  const totalToday = todayTickets.length

  const allDone = totalToday === 0 || resolvedCount === totalToday
  const remaining = totalToday - resolvedCount

  const progressLabel =
    totalToday === 0
      ? 'Không có sự cố hôm nay'
      : `${resolvedCount}/${totalToday} đã giải quyết`

  const statusColor = remaining > 0 ? '#DB7706' : '#2463EB'
  const statusLabel = allDone
    ? null
    : remaining > 2
    ? 'Còn nhiều việc'
    : `Còn ${remaining} chưa xử lý`

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <Text style={styles.sectionTitle}>Lịch hôm nay</Text>

      {allDone ? (
        <View style={styles.itemRow}>
          <View style={styles.iconWrapper}>
            <CalendarIcon width={48} height={48} color='#2463EB' />
          </View>
          <View style={styles.content}>
            <Text style={styles.doneTitle}>
              {totalToday === 0
                ? 'Ngày sạch — không có sự cố nào'
                : `Hoàn tất ${resolvedCount} sự cố hôm nay`}
            </Text>
            <Text style={styles.doneSubtitle}>{formatToday()}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.itemRow}>
          <View style={styles.iconWrapper}>
            <CalendarIcon width={48} height={48} color='#2463EB' />
          </View>
          <View style={styles.content}>
            <Text style={styles.orgName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.period}>{progressLabel}</Text>
            <View style={styles.deadlineRow}>
              <Text style={styles.deadline}>{formatToday()}</Text>
              {statusLabel && (
                <>
                  <ClockIcon width={14} height={14} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {statusLabel}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  orgName: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  period: {
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
  deadline: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: '#4B5563',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
  doneTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    color: '#111827',
  },
  doneSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: '#4B5563',
  },
})
