import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { SEVERITY_META } from '@/constants/incident'
import { IncidentStatusBadge } from './IncidentStatusBadge'
import type { IncidentTicket } from '@/types/incident'

interface Props {
  item: IncidentTicket
  categoryName?: string
  onPress: () => void
  onLongPress?: () => void
}

export function IncidentCard({ item, categoryName, onPress, onLongPress }: Props) {
  const severity = SEVERITY_META[item.severity]
  const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN')

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <IncidentStatusBadge status={item.status} />
      </View>

      <View style={styles.bottom}>
        <View style={styles.severityChip}>
          <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
          <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
        </View>
        <View style={styles.bottomRight}>
          {item.isAiResolved ? (
            <View style={styles.aiBadge}>
              <MaterialIcons name='auto-awesome' size={11} color='#7C3AED' />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          ) : null}
          <Text style={styles.date}>{dateStr}</Text>
        </View>
      </View>

      {(categoryName || item.zone) ? (
        <Text style={styles.meta} numberOfLines={1}>
          {[categoryName, item.zone?.name].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1F2937',
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  bottomRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#7C3AED',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  date: { fontSize: 14, color: '#4B5563', fontFamily: 'Inter_400Regular' },
  meta: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 6 },
})
