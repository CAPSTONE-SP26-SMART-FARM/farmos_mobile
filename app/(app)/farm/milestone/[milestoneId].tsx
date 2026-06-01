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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  body: { flex: 1 },
  tabPanel: { ...StyleSheet.absoluteFillObject },
  hidden: { display: 'none' },
})
