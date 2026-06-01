import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { TopBar, PillTabs } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'
import { MilestoneSensorsTab } from '@/components/features/sensor/MilestoneSensorsTab'
import { MilestoneTasksTab } from '@/components/features/dailyLog/MilestoneTasksTab'

type MilestoneTab = 'sensors' | 'tasks'

const TABS: readonly PillTabItem<MilestoneTab>[] = [
  { key: 'sensors', label: 'Cảm biến' },
  { key: 'tasks', label: 'Công việc' },
]

export default function MilestoneDetailScreen() {
  const { milestoneId, stageName } = useLocalSearchParams<{
    milestoneId: string
    stageName?: string
  }>()
  const [activeTab, setActiveTab] = useState<MilestoneTab>('sensors')

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title={stageName ?? 'Giai đoạn'} />

      <View style={styles.tabsWrap}>
        <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      </View>

      <View style={styles.body}>
        <View style={[styles.tabPanel, activeTab === 'sensors' ? null : styles.hidden]}>
          <MilestoneSensorsTab milestoneId={milestoneId ?? ''} />
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#15803D' />
        }
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#15803D' />
        ) : assignments.length === 0 ? (
          <EmptyState message='Giai đoạn này chưa gắn thiết bị.' Icon={icons.emptyCartSvg} />
        ) : (
          <View style={styles.list}>
            {assignments.map((a) => (
              <TouchableOpacity
                key={a.assignmentId}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/farm/[assignmentId]',
                    params: { assignmentId: a.assignmentId, milestoneId: milestoneId ?? '' },
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    {a.device.label ? (
                      <Text style={styles.kitLabel}>{a.device.label}</Text>
                    ) : null}
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {a.device.deviceName}
                    </Text>
                  </View>
                  <Text style={styles.cardSubtitle}>{a.sensors.length} cảm biến</Text>
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
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
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
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kitLabel: {
    fontSize: 13,
    color: '#15803D',
    fontFamily: 'Inter_700Bold',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardTitle: { flex: 1, fontSize: 14, color: '#111827', fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  cardSubtitle: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
