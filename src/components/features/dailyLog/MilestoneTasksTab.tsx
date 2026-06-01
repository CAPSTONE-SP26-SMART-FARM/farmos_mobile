import { useCallback, useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, EmptyState, PillTabs } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'
import { useTodayTasks } from '@/hooks/useDailyLog'
import { icons } from '@/constants/icon'
import type { TaskForDailyLog } from '@/types/dailyLog'

type TaskFilter = 'all' | 'pending' | 'logged'

const FILTER_TABS: readonly PillTabItem<TaskFilter>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Cần ghi' },
  { key: 'logged', label: 'Đã ghi' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low: '#6B7280',
  normal: '#2463EB',
  high: '#D97706',
  urgent: '#DC2626',
}
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

function filterToHasLogged(f: TaskFilter): boolean | undefined {
  if (f === 'pending') return false
  if (f === 'logged') return true
  return undefined
}

function TaskCard({ task, onPress }: { task: TaskForDailyLog; onPress: () => void }) {
  const progress = Math.max(0, Math.min(100, Math.round(task.progress ?? 0)))
  const progressColor = progress >= 100 ? '#16A34A' : '#2463EB'
  const logged = task.hasLoggedToday === true
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
          {logged ? (
            <View style={styles.loggedBadge}>
              <MaterialIcons name='check-circle' size={12} color='#16A34A' />
              <Text style={styles.loggedBadgeText}>Đã ghi</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.metaCaption}>Độ ưu tiên:</Text>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: PRIORITY_COLOR[task.priority] ?? '#2463EB' },
            ]}
          />
          <Text
            style={[
              styles.priorityLabel,
              { color: PRIORITY_COLOR[task.priority] ?? '#2463EB' },
            ]}
          >
            {PRIORITY_LABEL[task.priority] ?? task.priority}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.metaCaption}>Tiến độ:</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: progressColor },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: progressColor }]}>{progress}%</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

export function MilestoneTasksTab({ milestoneId }: { milestoneId: string }) {
  const router = useRouter()
  const [filter, setFilter] = useState<TaskFilter>('all')

  const { data, isLoading, refetch } = useTodayTasks({
    milestoneId,
    hasLoggedToday: filterToHasLogged(filter),
  })
  const tasks = data?.data ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const emptyMessage =
    filter === 'logged'
      ? 'Chưa có công việc nào được ghi nhật ký hôm nay.'
      : filter === 'pending'
        ? 'Tất cả công việc của giai đoạn này đã được ghi hôm nay.'
        : 'Giai đoạn này chưa có công việc nào.'

  return (
    <View style={styles.container}>
      <View style={styles.filterWrap}>
        <PillTabs items={FILTER_TABS} value={filter} onChange={setFilter} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#2463EB' />
        }
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
        ) : tasks.length === 0 ? (
          <EmptyState message={emptyMessage} Icon={icons.emptyCartSvg} />
        ) : (
          <View style={styles.list}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/daily-log/[taskId]',
                    params: {
                      taskId: task.id,
                      title: task.title,
                      priority: task.priority,
                      progress: String(task.progress ?? 0),
                    },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },
  list: { gap: 12 },

  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  loggedBadgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontFamily: 'Inter_600SemiBold',
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaCaption: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_600SemiBold',
    minWidth: 34,
    textAlign: 'right',
  },

  chevron: { fontSize: 22, color: '#9CA3AF' },
})
