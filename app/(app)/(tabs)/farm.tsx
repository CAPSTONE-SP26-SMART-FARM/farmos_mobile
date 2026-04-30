import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, EmptyState, PillTabs } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'
import { useMyAssignments } from '@/hooks/useIncident'
import { useTasksForDailyLog } from '@/hooks/useDailyLog'
import { icons } from '@/constants/icon'
import type { TaskForDailyLog } from '@/types/dailyLog'

const DiaryIcon = icons.diarySvg

type FarmTab = 'sensors' | 'tasks'

const TABS: readonly PillTabItem<FarmTab>[] = [
  { key: 'sensors', label: 'Cảm biến' },
  { key: 'tasks', label: 'Công việc' },
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

function TaskCard({ task, onPress }: { task: TaskForDailyLog; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardIconWrap}>
        <DiaryIcon width={22} height={22} color='#2463EB' />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[task.priority] ?? '#2463EB' }]} />
          <Text style={[styles.priorityLabel, { color: PRIORITY_COLOR[task.priority] ?? '#2463EB' }]}>
            {PRIORITY_LABEL[task.priority] ?? task.priority}
          </Text>
        </View>
      </View>
      <View style={styles.logBadge}>
        <Text style={styles.logBadgeText}>Ghi nhật ký</Text>
      </View>
    </TouchableOpacity>
  )
}

function SensorsTab() {
  const router = useRouter()
  const { data: assignments = [], isLoading } = useMyAssignments()

  if (isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
  if (assignments.length === 0) return <EmptyState message='Bạn chưa được gán thiết bị nào.' />

  return (
    <View style={styles.list}>
      {assignments.map((a) => (
        <TouchableOpacity
          key={a.assignmentId}
          style={styles.card}
          onPress={() => router.push(`/(app)/farm/${a.assignmentId}`)}
          activeOpacity={0.85}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{a.device.deviceName}</Text>
            <Text style={styles.cardSubtitle}>{a.sensors.length} cảm biến</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function TasksTab() {
  const router = useRouter()
  const { data, isLoading } = useTasksForDailyLog()
  const tasks = data?.data ?? []

  if (isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
  if (tasks.length === 0) {
    return (
      <EmptyState
        message='Không có công việc nào cần ghi nhật ký hôm nay.'
      />
    )
  }

  return (
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
              },
            })
          }
        />
      ))}
    </View>
  )
}

export default function FarmScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<FarmTab>('sensors')

  useEffect(() => {
    if (tab === 'tasks') setActiveTab('tasks')
  }, [tab])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Trang trại</Text>
        <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} style={styles.tabs} />
        {activeTab === 'sensors' ? <SensorsTab /> : <TasksTab />}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
  tabs: { marginBottom: 20 },
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
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 14, color: '#111827', fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  cardSubtitle: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  logBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logBadgeText: { fontSize: 12, color: '#2463EB', fontFamily: 'Inter_500Medium' },

  cardContent: { flex: 1 },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
