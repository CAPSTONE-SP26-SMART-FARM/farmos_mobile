import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatRelativeTime } from '@/utils/date'
import type { Alert, AlertSeverity } from '@/types/alert'

const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; badgeBg: string; badgeText: string }> = {
  low:      { label: 'Trong ngưỡng', color: '#16A249', badgeBg: '#DCFCE7', badgeText: '#166434' },
  medium:   { label: 'Gần ngưỡng',  color: '#DB7706', badgeBg: '#FEF3C8', badgeText: '#92400E' },
  high:     { label: 'Vượt ngưỡng', color: '#DC2828', badgeBg: '#FEE2E2', badgeText: '#991B1B' },
  critical: { label: 'Nguy hiểm',   color: '#991B1B', badgeBg: '#FEE2E2', badgeText: '#7F1D1D' },
}

const RESOLVED_META = { label: 'Đã xử lý', badgeBg: '#F3F4F6', badgeText: '#4B5563' }

// Bỏ "Cảm biến " ở đầu + " an toàn" ở cuối cho gọn:
// "Cảm biến Nhiệt độ vượt ngưỡng an toàn" → "Nhiệt độ vượt ngưỡng"
function shortTitle(title: string): string {
  return title
    .replace(/^Cảm biến\s+/i, '')
    .replace(/\s+an toàn$/i, '')
    .trim()
}

export function AlertCard({ item }: { item: Alert }) {
  const severity = SEVERITY_META[item.severity] ?? SEVERITY_META.medium
  const resolved = item.isResolved
  const status = resolved ? RESOLVED_META : { label: severity.label, badgeBg: severity.badgeBg, badgeText: severity.badgeText }

  const actual = item.actualValue ? Number(item.actualValue) : null
  const threshold = item.thresholdValue ? Number(item.thresholdValue) : null
  // max threshold: actual/threshold (87/85 → full). min threshold: threshold/actual (22/20.5 → full)
  const progress = actual !== null && threshold !== null && threshold > 0
    ? Math.min(actual >= threshold ? actual / threshold : threshold / actual, 1)
    : 1

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{shortTitle(item.title)}</Text>
        <View style={[styles.badge, { backgroundColor: status.badgeBg }]}>
          <Text style={[styles.badgeText, { color: status.badgeText }]}>{status.label}</Text>
        </View>
      </View>

      {actual !== null && (
        <Text style={styles.value}>{actual}</Text>
      )}

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: resolved ? '#9CA3AF' : severity.color,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {threshold !== null ? `${item.zoneName} · Ngưỡng ${threshold}` : item.zoneName}
        </Text>
        <Text style={styles.metaText}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
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
    gap: 8,
    marginBottom: 6,
  },
  title: { flex: 1, fontSize: 14, lineHeight: 20, color: '#374151', fontFamily: 'Inter_600SemiBold' },
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
})
