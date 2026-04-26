import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { SEVERITY_META } from '@/constants/incident'
import { useAuth } from '@/hooks/useAuth'
import { IncidentStatusBadge } from './IncidentStatusBadge'
import type { IncidentTicket } from '@/types/incident'

interface Props {
  item: IncidentTicket
  onPress: () => void
}

export function IncidentCard({ item, onPress }: Props) {
  const severity = SEVERITY_META[item.severity]
  const { user } = useAuth()
  const canEditStatus = user?.role === 'farmer'

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <IncidentStatusBadge ticketId={item.id} status={item.status} editable={canEditStatus} />
      </View>
      <View style={styles.metaRow}>
        <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
        <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Text style={styles.meta}>
          {item.zone ? `${item.zone.name}  ·  ` : ''}
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  metaSep: { fontSize: 12, color: '#9CA3AF' },
  meta: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
