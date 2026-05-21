import { useCallback, useState } from 'react'
import {
  View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { SensorCard } from '@/components/features/sensor/SensorCard'
import { useSensorReadings } from '@/hooks/useSensorReadings'
import { useFarmerMilestoneAssignments } from '@/hooks/useFarmerMilestones'

export default function AssignmentDetailScreen() {
  const { assignmentId, milestoneId } = useLocalSearchParams<{
    assignmentId: string
    milestoneId?: string
  }>()

  const { data: assignmentsRes } = useFarmerMilestoneAssignments(milestoneId ?? '', { page: 1, limit: 50 })
  const assignment = assignmentsRes?.data.find((a) => a.assignmentId === assignmentId)

  const { data, isLoading, refetch } = useSensorReadings(assignmentId ?? '')
  const readings = data?.data ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }, [refetch])

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title={assignment?.device.deviceName ?? 'Chi tiết'} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#2463EB' />
        }
      >
        {assignment && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>
                Thiết bị{assignment.device.label ? ` · ${assignment.device.label}` : ''}
              </Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {assignment.device.deviceName}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Cảm biến</Text>
              <Text style={styles.summaryValue}>{assignment.sensors.length}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Số liệu mới nhất</Text>

        {isLoading ? (
          <ActivityIndicator color='#2463EB' style={{ marginTop: 24 }} />
        ) : readings.length === 0 ? (
          <EmptyState message='Chưa có dữ liệu cảm biến.' />
        ) : (
          <View style={styles.list}>
            {readings.map((r) => <SensorCard key={r.sensorId} item={r} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 24 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
  },
  summaryCol: { flex: 1 },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24,
    color: '#111827', fontFamily: 'Inter_600SemiBold',
    marginTop: 18, marginBottom: 10,
  },
  list: { gap: 10 },
})
