import { useState, useEffect, useRef } from 'react'
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Text } from '@/components/ui'
import { SensorCard } from '@/components/features/sensor/SensorCard'
import { useSensorReadings } from '@/hooks/useSensorReadings'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'

export default function SensorScreen() {
  const [assignmentId, setAssignmentId] = useState('')
  const [activeId, setActiveId] = useState('')
  const [socketStatus, setSocketStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const qc = useQueryClient()

  const { data, isLoading, isError } = useSensorReadings(activeId)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (socketStatus !== 'connected') {
      pulseAnim.setValue(1)
      return
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [socketStatus, pulseAnim])

  const handleConnect = async () => {
    if (!assignmentId.trim()) return
    setSocketStatus('connecting')
    setActiveId(assignmentId.trim())
    await socketService.connect()
    setSocketStatus('connected')
  }

  const handleRefresh = () => {
    if (!activeId) return
    qc.invalidateQueries({ queryKey: queryKeys.sensorReading.latestByAssignment(activeId) })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading && !!activeId} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.title}>Sensor Readings</Text>
        <Text style={styles.subtitle}>Dữ liệu cảm biến theo thời gian thực</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Assignment ID..."
            placeholderTextColor="#9CA3AF"
            value={assignmentId}
            onChangeText={setAssignmentId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.connectBtn, socketStatus === 'connected' && styles.connectBtnActive]}
            onPress={handleConnect}
            disabled={socketStatus === 'connecting'}
          >
            {socketStatus === 'connecting' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.connectBtnText}>
                {socketStatus === 'connected' ? 'Đã kết nối' : 'Xem'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {socketStatus !== 'idle' && (
          <View style={styles.statusRow}>
            <Animated.View style={[styles.statusDot, {
              backgroundColor: socketStatus === 'connected' ? '#16A34A' : '#F59E0B',
              opacity: socketStatus === 'connected' ? pulseAnim : 1,
            }]} />
            <Text style={styles.statusText}>
              Socket: {socketStatus === 'connected' ? 'Đang lắng nghe thay đổi' : 'Đang kết nối...'}
            </Text>
          </View>
        )}

        {isLoading && activeId ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
        ) : isError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Không thể tải dữ liệu. Kiểm tra lại Assignment ID.</Text>
          </View>
        ) : data?.data.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có dữ liệu cảm biến.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {data?.data.map((item) => (
              <SensorCard key={item.sensorId} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4, marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 13,
    color: '#111827', fontFamily: 'Inter_400Regular',
  },
  connectBtn: {
    height: 44, paddingHorizontal: 18, borderRadius: 10,
    backgroundColor: '#2463EB', justifyContent: 'center', alignItems: 'center',
  },
  connectBtnActive: { backgroundColor: '#16A34A' },
  connectBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  list: { marginTop: 20, gap: 12 },
  emptyBox: { marginTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular', textAlign: 'center' },
})
