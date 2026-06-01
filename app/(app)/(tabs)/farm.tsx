import { useMemo } from 'react'
import { useRouter } from 'expo-router'
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, EmptyState } from '@/components/ui'
import { useFarmerCurrentUpcomingMilestones } from '@/hooks/useFarmerMilestones'
import { icons } from '@/constants/icon'
import type { FarmerCurrentUpcomingMilestone } from '@/types/farmerIot'

type FarmTab = 'sensors' | 'tasks'

const TABS: readonly PillTabItem<FarmTab>[] = [
  { key: 'sensors', label: 'Cảm biến' },
  { key: 'tasks', label: 'Công việc' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low: '#6B7280',
  normal: '#15803D',
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
  const progress = Math.max(0, Math.min(100, Math.round(task.progress ?? 0)))
  const progressColor = progress >= 100 ? '#16A34A' : '#15803D'
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaCaption}>Độ ưu tiên:</Text>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[task.priority] ?? '#15803D' }]} />
          <Text style={[styles.priorityLabel, { color: PRIORITY_COLOR[task.priority] ?? '#15803D' }]}>
            {PRIORITY_LABEL[task.priority] ?? task.priority}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.metaCaption}>Tiến độ:</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
          </View>
          <Text style={[styles.progressText, { color: progressColor }]}>{progress}%</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

function SensorsTab() {
  const router = useRouter()
  const { data: milestones = [], isLoading } = useFarmerCurrentUpcomingMilestones()

  const byZone = useMemo(() => {
    const acc: Record<string, FarmerCurrentUpcomingMilestone[]> = {}
    for (const m of milestones) {
      (acc[m.zoneName] ??= []).push(m)
    }
    for (const zone in acc) {
      acc[zone].sort((a, b) => a.milestoneOrder - b.milestoneOrder)
    }
    return acc
  }, [milestones])

  if (isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color='#15803D' />
  if (milestones.length === 0) {
    return <EmptyState message='Chưa có giai đoạn nào.' Icon={icons.emptyCartSvg} />
  }

  return (
    <View style={styles.list}>
      {Object.entries(byZone).map(([zoneName, items]) => (
        <View key={zoneName} style={styles.zoneGroup}>
          <View style={styles.sectionHeader}>
            <View style={styles.zoneChip}>
              <MaterialIcons name='place' size={16} color='#15803D' />
              <Text style={styles.zoneChipText}>{zoneName}</Text>
            </View>
            <Text style={styles.sectionCount}>{items.length} giai đoạn</Text>
          </View>
          <View style={styles.zoneItems}>
            {items.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/farm/milestone/[milestoneId]',
                    params: { milestoneId: m.id, stageName: m.stageName },
                  })
                }
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{m.stageName}</Text>
                  <View style={styles.cardMeta}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: m.status === 'in_progress' ? '#16A34A' : '#D97706' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        { color: m.status === 'in_progress' ? '#16A34A' : '#D97706' },
                      ]}
                    >
                      {m.status === 'in_progress' ? 'Đang diễn ra' : 'Sắp tới'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

function TasksTab() {
  const router = useRouter()
  const { data, isLoading } = useTasksForDailyLog()
  const tasks = data?.data ?? []

  if (isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color='#15803D' />
  if (tasks.length === 0) {
    return (
      <EmptyState
        message='Không có công việc nào cần ghi nhật ký hôm nay.'
        Icon={icons.emptyCartSvg}
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
                progress: String(task.progress ?? 0),
              },
            })
          }
        />
      ))}
    </View>
  )
}

export default function FarmScreen() {
  const router = useRouter()
  const { data: milestones = [], isLoading } = useFarmerCurrentUpcomingMilestones()

  // Per zone, keep only the currently in-progress milestone.
  // Zones with no active milestone are hidden — farmer can't work there yet.
  const zones: ZoneEntry[] = useMemo(() => {
    const byZone = new Map<string, FarmerCurrentUpcomingMilestone>()
    for (const m of milestones) {
      if (m.status !== 'in_progress') continue
      const existing = byZone.get(m.zoneId)
      if (!existing || m.milestoneOrder < existing.milestoneOrder) {
        byZone.set(m.zoneId, m)
      }
    }
    return Array.from(byZone.values())
      .map((milestone) => ({ zoneName: milestone.zoneName, milestone }))
      .sort((a, b) => a.zoneName.localeCompare(b.zoneName))
  }, [milestones])

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Trang trại</Text>
        <Text style={styles.subtitle}>Khu vực bạn đang làm việc</Text>
      </View>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
        ) : zones.length === 0 ? (
          <EmptyState message='Chưa có khu vực nào đang hoạt động.' Icon={icons.emptyCartSvg} />
        ) : (
          <View style={styles.list}>
            {zones.map(({ zoneName, milestone }) => (
              <TouchableOpacity
                key={milestone.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/farm/milestone/[milestoneId]',
                    params: {
                      milestoneId: milestone.id,
                      stageName: milestone.stageName,
                    },
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View style={styles.zoneRow}>
                    <MaterialIcons name='place' size={16} color='#2463EB' />
                    <Text style={styles.zoneName}>{zoneName}</Text>
                  </View>
                  <Text style={styles.stageName} numberOfLines={1}>
                    {milestone.stageName}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusLabel}>Đang diễn ra</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, lineHeight: 32, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },
  list: { gap: 12 },
  zoneGroup: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  zoneChipText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#15803D',
    fontFamily: 'Inter_700Bold',
  },
  sectionCount: {
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },
  zoneItems: {
    gap: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },

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
  cardContent: { flex: 1, gap: 4 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoneName: {
    fontSize: 13,
    color: '#2463EB',
    fontFamily: 'Inter_600SemiBold',
  },
  stageName: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  statusLabel: { fontSize: 12, color: '#16A34A', fontFamily: 'Inter_500Medium' },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
