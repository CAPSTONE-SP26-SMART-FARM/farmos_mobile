import {
  View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { SensorCard } from '@/components/features/sensor/SensorCard'
import { useSensorReadings } from '@/hooks/useSensorReadings'
import { useMyAssignments } from '@/hooks/useIncident'

export default function AssignmentDetailScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>()

  const { data: assignments = [] } = useMyAssignments()
  const assignment = assignments.find((a) => a.assignmentId === assignmentId)

  const { data, isLoading, isFetching, refetch } = useSensorReadings(assignmentId ?? '')
  const readings = data?.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title={assignment?.device.deviceName ?? 'Chi tiết'} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor='#2463EB' />}
      >
        {assignment && (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Thiết bị</Text>
            <Text style={styles.summaryValue}>{assignment.device.deviceName}</Text>
            <Text style={styles.summaryLabel}>Cảm biến</Text>
            <Text style={styles.summaryValue}>{assignment.sensors.length}</Text>
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
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 32 },
  summary: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB', gap: 4,
  },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
  summaryValue: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  sectionTitle: {
    fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold',
    marginTop: 20, marginBottom: 10,
  },
  list: { gap: 10 },
})
