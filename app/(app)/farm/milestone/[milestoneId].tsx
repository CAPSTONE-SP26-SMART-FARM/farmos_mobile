import { useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { TopBar, PillTabs } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'
import { MilestoneSensorsTab } from '@/components/features/sensor/MilestoneSensorsTab'
import { MilestoneTasksTab } from '@/components/features/dailyLog/MilestoneTasksTab'
import { useFarmerCurrentUpcomingMilestones } from '@/hooks/useFarmerMilestones'
import type { FarmerMilestoneStatus } from '@/types/farmerIot'

type MilestoneTab = 'sensors' | 'tasks'

const TABS: readonly PillTabItem<MilestoneTab>[] = [
  { key: 'sensors', label: 'Cảm biến' },
  { key: 'tasks', label: 'Công việc' },
]

export default function MilestoneDetailScreen() {
  const { milestoneId, stageName, tab, milestoneStatus } = useLocalSearchParams<{
    milestoneId: string
    stageName?: string
    tab?: MilestoneTab
    milestoneStatus?: FarmerMilestoneStatus
  }>()

  const initialTab: MilestoneTab = tab === 'tasks' ? 'tasks' : 'sensors'
  const [activeTab, setActiveTab] = useState<MilestoneTab>(initialTab)

  // Param ưu tiên; fallback đọc từ cache hook (deep link không kèm status).
  const { data: milestones = [] } = useFarmerCurrentUpcomingMilestones()
  const resolvedStatus = useMemo<FarmerMilestoneStatus | undefined>(() => {
    if (milestoneStatus) return milestoneStatus
    return milestones.find((m) => m.id === milestoneId)?.status
  }, [milestoneStatus, milestones, milestoneId])

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title={stageName ?? 'Giai đoạn'} />

      <View style={styles.tabsWrap}>
        <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      </View>
      <View style={styles.tabsDivider} />

      <View style={styles.body}>
        <View style={[styles.tabPanel, activeTab === 'sensors' ? null : styles.hidden]}>
          <MilestoneSensorsTab
            milestoneId={milestoneId ?? ''}
            milestoneStatus={resolvedStatus}
          />
        </View>
        <View style={[styles.tabPanel, activeTab === 'tasks' ? null : styles.hidden]}>
          <MilestoneTasksTab milestoneId={milestoneId ?? ''} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabsDivider: { height: 1, backgroundColor: '#F3F4F6' },
  body: { flex: 1 },
  tabPanel: { ...StyleSheet.absoluteFillObject },
  hidden: { display: 'none' },
})
