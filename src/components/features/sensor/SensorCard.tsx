import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import type { SensorReading } from '@/services/api/sensorReading'

const SENSOR_LABELS: Record<string, string> = {
  soil_moisture: 'Độ ẩm đất',
  air_temperature: 'Nhiệt độ không khí',
  air_humidity: 'Độ ẩm không khí',
  light_intensity: 'Cường độ ánh sáng',
}

const SENSOR_UNITS: Record<string, string> = {
  soil_moisture: '%',
  air_temperature: '°C',
  air_humidity: '%',
  light_intensity: 'lux',
}

export function SensorCard({ item }: { item: SensorReading }) {
  const label = SENSOR_LABELS[item.sensorType] ?? item.sensorType
  const unit = SENSOR_UNITS[item.sensorType] ?? ''
  const safeColor = item.isSafe === null ? '#9CA3AF' : item.isSafe ? '#16A34A' : '#DC2626'
  const safeBg = item.isSafe === null ? '#F3F4F6' : item.isSafe ? '#DCFCE7' : '#FEE2E2'
  const safeLabel = item.isSafe === null ? 'Chưa có dữ liệu' : item.isSafe ? 'An toàn' : 'Cảnh báo'

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: safeBg }]}>
          <Text style={[styles.badgeText, { color: safeColor }]}>{safeLabel}</Text>
        </View>
      </View>

      <Text style={styles.value}>
        {item.value !== null ? `${item.value}${unit}` : '—'}
      </Text>

      {item.threshold && (
        <Text style={styles.threshold}>
          Tối ưu: {item.threshold.optimalMin} – {item.threshold.optimalMax}{unit}
          {'  ·  '}Nguồn: {item.threshold.source === 'milestone' ? 'Milestone' : 'Zone'}
        </Text>
      )}

      {item.timestamp && (
        <Text style={styles.timestamp}>
          Cập nhật: {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, color: '#374151', fontFamily: 'Inter_600SemiBold', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  value: { fontSize: 32, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 6 },
  threshold: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular', marginBottom: 4 },
  timestamp: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
