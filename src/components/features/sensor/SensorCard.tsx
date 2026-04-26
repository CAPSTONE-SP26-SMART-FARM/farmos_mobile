import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatRelativeTime } from '@/utils/date'
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

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 phút
function isStale(iso: string): boolean {
  const t = new Date(iso).getTime()
  return !Number.isNaN(t) && Date.now() - t > STALE_THRESHOLD_MS
}

export function SensorCard({ item }: { item: SensorReading }) {
  const label = SENSOR_LABELS[item.sensorType] ?? item.sensorType
  const unit = SENSOR_UNITS[item.sensorType] ?? ''

  const status =
    item.isSafe === null
      ? { color: '#6B7280', badgeBg: '#F3F4F6', badgeText: '#4B5563', label: 'Chưa có dữ liệu' }
      : item.isSafe
        ? { color: '#16A249', badgeBg: '#DCFCE7', badgeText: '#166434', label: 'An toàn' }
        : { color: '#DC2828', badgeBg: '#FEF1F1', badgeText: '#BA1C1C', label: 'Cảnh báo' }

  const optMin = item.threshold?.optimalMin
  const optMax = item.threshold?.optimalMax
  const hasRange = typeof optMin === 'number' && typeof optMax === 'number' && optMax > optMin
  const value = item.value

  // Khi an toàn → fill = vị trí value trong range optimal.
  // Khi value ngoài range → fill = 100% màu cảnh báo (rõ ràng visually).
  let progress = 0
  if (hasRange && value !== null) {
    if (item.isSafe) {
      progress = clamp01((value - optMin!) / (optMax! - optMin!))
    } else {
      progress = 1
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: status.badgeBg }]}>
          <Text style={[styles.badgeText, { color: status.badgeText }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.value}>
        {value !== null ? `${value}${unit}` : '—'}
      </Text>

      {hasRange && (
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: status.color }]}
          />
        </View>
      )}

      {hasRange && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Tối ưu {optMin}–{optMax}{unit}
          </Text>
          {item.timestamp && (
            <Text style={[styles.metaText, isStale(item.timestamp) && styles.metaStale]}>
              {formatRelativeTime(item.timestamp)}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 14, lineHeight: 20, color: '#374151', fontFamily: 'Inter_600SemiBold', flex: 1 },
  badge: { height: 24, borderRadius: 8, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  value: {
    fontSize: 26,
    lineHeight: 34,
    color: '#111827',
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: 6, borderRadius: 999 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: { fontSize: 12, lineHeight: 16, color: '#4B5563', fontFamily: 'Inter_500Medium' },
  metaStale: { color: '#DB7706' },
})
