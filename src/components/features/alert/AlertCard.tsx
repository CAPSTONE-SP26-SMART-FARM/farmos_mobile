import { View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { formatRelativeTime, formatDateTime } from '@/utils/date'
import { detectSensorKind, SENSOR_ICON, SENSOR_UNIT } from '@/utils/sensor'
import { capitalize, shortAlertTitle } from '@/utils/text'
import type { Alert, AlertSeverity } from '@/types/alert'

const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; badgeBg: string; badgeText: string }> = {
  low:      { label: 'Trong ngưỡng', color: '#16A249', badgeBg: '#DCFCE7', badgeText: '#166434' },
  medium:   { label: 'Gần ngưỡng',  color: '#DB7706', badgeBg: '#FEF3C8', badgeText: '#92400E' },
  high:     { label: 'Vượt ngưỡng', color: '#DC2828', badgeBg: '#FEE2E2', badgeText: '#991B1B' },
  critical: { label: 'Nguy hiểm',   color: '#991B1B', badgeBg: '#FEE2E2', badgeText: '#7F1D1D' },
}

const RESOLVED_META = { label: 'Đã xử lý', badgeBg: '#F3F4F6', badgeText: '#4B5563' }

export function AlertCard({ item }: { item: Alert }) {
  const severity = SEVERITY_META[item.severity] ?? SEVERITY_META.medium
  const resolved = item.isResolved
  const status = resolved
    ? RESOLVED_META
    : { label: severity.label, badgeBg: severity.badgeBg, badgeText: severity.badgeText }

  // Ưu tiên sensorType từ BE; fallback parse từ title (BE đặt format cố định)
  const kind = (item.sensorType as keyof typeof SENSOR_ICON) ?? detectSensorKind(item.title)
  const unit = kind ? SENSOR_UNIT[kind] ?? '' : ''
  const iconName = kind ? SENSOR_ICON[kind] : undefined
  const actual = item.actualValue ?? null
  const hasRange =
    typeof item.optimalMin === 'number' && typeof item.optimalMax === 'number'

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {iconName ? (
            <MaterialIcons name={iconName} size={18} color='#4B5563' />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {capitalize(shortAlertTitle(item.title))}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.badgeBg }]}>
          <Text style={[styles.badgeText, { color: status.badgeText }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Giá trị ghi nhận</Text>
          <Text style={[styles.statValue, { color: resolved ? '#111827' : severity.color }]}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  title: { flex: 1, fontSize: 14, lineHeight: 20, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_500Medium' },

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
