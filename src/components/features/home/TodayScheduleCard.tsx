import { Text } from '@/components/ui'
import { icons } from '@/constants/icon'
import type { IncidentTicket } from '@/types/incident'
import { isToday } from '@/utils/date'
import { router } from 'expo-router'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

const CalendarIcon = icons.calendarBgSvg

const DONE_STATUSES = ['resolved', 'closed']

function formatToday() {
  // "Thứ Ba, 02/06/2026"
  const s = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  // Capitalize first letter ("thứ ba" → "Thứ ba")
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  tickets: IncidentTicket[]
  tasksCount?: number
  /** Khi user bấm vào card task, jump thẳng vào milestone "trọng tâm" (nếu có). */
  targetMilestoneId?: string
  targetMilestoneStageName?: string
  delay?: number
}

export function TodayScheduleCard({
  tickets,
  tasksCount,
  targetMilestoneId,
  targetMilestoneStageName,
  delay = 150,
}: Props) {
  const isTaskMode = tasksCount !== undefined

  const todayTickets = tickets.filter((t) => isToday(t.createdAt))
  const resolvedCount = todayTickets.filter((t) => DONE_STATUSES.includes(t.status)).length
  const totalToday = isTaskMode ? (tasksCount ?? 0) : todayTickets.length

  const allDone = isTaskMode ? totalToday === 0 : (totalToday === 0 || resolvedCount === totalToday)

  // Khi all done: hiển thị 1 dòng tổng kết.
  // Ngược lại: dòng 1 = ngày (caption), dòng 2 = số nổi bật + label.
  const remainingCount = isTaskMode ? totalToday : totalToday - resolvedCount

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <Text style={styles.sectionTitle}>Lịch hôm nay</Text>

      <TouchableOpacity
        style={styles.itemRow}
        activeOpacity={isTaskMode ? 0.7 : 1}
        disabled={!isTaskMode}
        onPress={() => {
          // Có milestone trọng tâm → mở thẳng vào tab Công việc của milestone đó.
          if (targetMilestoneId) {
            router.push({
              pathname: '/(app)/farm/milestone/[milestoneId]',
              params: {
                milestoneId: targetMilestoneId,
                stageName: targetMilestoneStageName ?? 'Giai đoạn',
                tab: 'tasks',
                milestoneStatus: 'in_progress',
              },
            })
            return
          }
          // Fallback: về danh sách trang trại.
          router.push({ pathname: '/(app)/(tabs)/farm', params: { tab: 'tasks' } })
        }}
      >
        <View style={styles.iconWrapper}>
          <CalendarIcon width={48} height={48} color='#15803D' />
        </View>

        {allDone ? (
          <View style={styles.content}>
            <Text style={styles.dateCaption}>{formatToday()}</Text>
            <Text style={styles.doneTitle}>
              {isTaskMode
                ? 'Không có công việc nào hôm nay'
                : totalToday === 0
                  ? 'Ngày sạch — không có sự cố nào'
                  : `Hoàn tất ${resolvedCount} sự cố hôm nay`}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.dateCaption}>{formatToday()}</Text>
            <View style={styles.countRow}>
              <Text style={styles.countNumber}>{remainingCount}</Text>
              <Text style={styles.countLabel}>
                {isTaskMode ? 'công việc cần làm' : 'sự cố chưa xử lý'}
              </Text>
            </View>
          </View>
        )}

        {isTaskMode && <Text style={styles.chevron}>›</Text>}
      </TouchableOpacity>
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
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  dateCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  countNumber: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Inter_700Bold',
    color: '#15803D',
  },
  countLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  doneTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#15803D',
  },
  chevron: {
    fontSize: 22,
    color: '#9CA3AF',
    lineHeight: 26,
  },
})
