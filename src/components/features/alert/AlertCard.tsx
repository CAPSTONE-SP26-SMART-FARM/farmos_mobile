import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { formatRelativeTime, formatDateTime } from '@/utils/date'
import { detectSensorKind, SENSOR_ICON, SENSOR_UNIT } from '@/utils/sensor'
import { capitalize, shortAlertTitle } from '@/utils/text'
import type { Alert, AlertSeverity } from '@/types/alert'

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  low:      '#16A249',
  medium:   '#DB7706',
  high:     '#DC2828',
  critical: '#991B1B',
}

const RESOLVED_COLOR = '#9CA3AF'

// Sensor-type icon colors — same palette as SensorCard for visual sync.
const SENSOR_ICON_COLOR: Record<string, string> = {
  air_temperature: '#EF4444',
  air_humidity:    '#0EA5E9',
  soil_moisture:   '#65A30D',
  light_intensity: '#F59E0B',
}

export function AlertCard({ item, onPress }: { item: Alert; onPress?: () => void }) {
  const resolved = item.isResolved
  const accent = resolved ? RESOLVED_COLOR : (SEVERITY_COLOR[item.severity] ?? SEVERITY_COLOR.medium)

  const kind = (item.sensorType as keyof typeof SENSOR_ICON) ?? detectSensorKind(item.title)
  const unit = kind ? SENSOR_UNIT[kind] ?? '' : ''
  const iconName = kind ? SENSOR_ICON[kind] : undefined
  const iconColor = kind ? SENSOR_ICON_COLOR[kind] ?? '#4B5563' : '#4B5563'
  const actual = item.actualValue ?? null
  const hasRange =
    typeof item.optimalMin === 'number' && typeof item.optimalMax === 'number'

  const Container: any = onPress ? TouchableOpacity : View
  const containerProps = onPress ? { activeOpacity: 0.85, onPress } : {}

  return (
    <Container style={[styles.card, { borderColor: accent }]} {...containerProps}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {iconName ? (
            <MaterialIcons name={iconName} size={18} color={iconColor} />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {capitalize(shortAlertTitle(item.title))}
          </Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Giá trị ghi nhận</Text>
          <Text style={[styles.statValue, { color: accent }]}>
            {actual !== null ? `${actual}${unit}` : '—'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Ngưỡng an toàn</Text>
          <Text style={styles.statValue}>
            {hasRange
              ? `${item.optimalMin}–${item.optimalMax}${unit}`
              : item.thresholdValue !== null
                ? `${item.thresholdValue}${unit}`
                : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.zoneName}</Text>
        <Text style={styles.metaText}>
          {formatRelativeTime(item.createdAt)} · {formatDateTime(item.createdAt)}
        </Text>
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: { flex: 1, fontSize: 14, lineHeight: 20, color: '#374151', fontFamily: 'Inter_600SemiBold' },

  statRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  statCol: { flex: 1, paddingHorizontal: 14 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 17,
    lineHeight: 22,
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaText: { fontSize: 11, lineHeight: 16, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
})
