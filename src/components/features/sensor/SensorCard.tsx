import { View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { formatRelativeTime } from '@/utils/date'
import type { SensorReading } from '@/services/api/sensorReading'

type SensorMeta = {
  label: string
  unit: string
  icon: React.ComponentProps<typeof MaterialIcons>['name']
  iconColor: string
  domain: [number, number]
}

const SENSOR_META: Record<string, SensorMeta> = {
  soil_moisture:    { label: 'Độ ẩm đất',          unit: '%',  icon: 'grass',             iconColor: '#65A30D', domain: [0, 100] },
  air_temperature:  { label: 'Nhiệt độ không khí', unit: '°C', icon: 'device-thermostat', iconColor: '#EF4444', domain: [0, 50] },
  air_humidity:     { label: 'Độ ẩm không khí',    unit: '%',  icon: 'water-drop',        iconColor: '#0EA5E9', domain: [0, 100] },
  light_intensity:  { label: 'Cường độ ánh sáng',  unit: '%',  icon: 'wb-sunny',          iconColor: '#F59E0B', domain: [0, 100] },
}

const FALLBACK_META: SensorMeta = { label: '', unit: '', icon: 'sensors', iconColor: '#4B5563', domain: [0, 100] }

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000
function isStale(iso: string): boolean {
  const t = new Date(iso).getTime()
  return !Number.isNaN(t) && Date.now() - t > STALE_THRESHOLD_MS
}

export function SensorCard({ item }: { item: SensorReading }) {
  const meta = SENSOR_META[item.sensorType] ?? { ...FALLBACK_META, label: item.sensorType }
  const [domMin, domMax] = meta.domain

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

  const optStart = hasRange ? clamp01((optMin! - domMin) / (domMax - domMin)) : 0
  const optEnd = hasRange ? clamp01((optMax! - domMin) / (domMax - domMin)) : 0
  const markerPos = value !== null ? clamp01((value - domMin) / (domMax - domMin)) : null

  return (
    <View style={[styles.card, { borderColor: status.color }]}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <MaterialIcons name={meta.icon} size={18} color={meta.iconColor} />
          <Text style={styles.label}>{meta.label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.badgeBg }]}>
          <Text style={[styles.badgeText, { color: status.badgeText }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={[styles.value, { color: status.color }]}>
        {value !== null ? `${value}${meta.unit}` : '—'}
      </Text>

      <View style={styles.track}>
        {hasRange && (
          <View
            style={[
              styles.optZone,
              {
                left: `${optStart * 100}%`,
                width: `${(optEnd - optStart) * 100}%`,
              },
            ]}
          />
        )}
        {markerPos !== null && (
          <View
            style={[
              styles.marker,
              { left: `${markerPos * 100}%`, backgroundColor: status.color },
            ]}
          />
        )}
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>{domMin}{meta.unit}</Text>
        <Text style={styles.scaleText}>{domMax}{meta.unit}</Text>
      </View>

      <View style={styles.metaRow}>
        {hasRange ? (
          <Text style={styles.metaText}>
            An toàn {optMin}–{optMax}{meta.unit}
          </Text>
        ) : <View />}
        {item.timestamp && (
          <Text style={[styles.metaText, isStale(item.timestamp) && styles.metaStale]}>
            {formatRelativeTime(item.timestamp)}
          </Text>
        )}
      </View>
    </View>
  )
}

const MARKER_SIZE = 14

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
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
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  label: { fontSize: 14, lineHeight: 20, color: '#374151', fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  badge: { height: 24, borderRadius: 8, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  value: {
    fontSize: 26,
    lineHeight: 34,
    color: '#111827',
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  track: {
    position: 'relative',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    marginBottom: 6,
    marginHorizontal: MARKER_SIZE / 2,
  },
  optZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#86EFAC',
    borderRadius: 999,
  },
  marker: {
    position: 'absolute',
    top: (6 - MARKER_SIZE) / 2,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    marginLeft: -MARKER_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scaleText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: { fontSize: 12, lineHeight: 16, color: '#4B5563', fontFamily: 'Inter_500Medium' },
  metaStale: { color: '#DB7706' },
})
