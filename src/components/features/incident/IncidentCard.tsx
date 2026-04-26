import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import type { IncidentTicket } from '@/types/incident'

interface Props {
  item: IncidentTicket
  onPress: () => void
}

export function IncidentCard({ item, onPress }: Props) {
  const severity = SEVERITY_META[item.severity]
  const status = STATUS_META[item.status]

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.ticketNum}>{item.ticketNumber}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: severity.bg }]}>
            <Text style={[styles.badgeText, { color: severity.color }]}>{severity.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.meta}>
        {item.zone ? `Khu vực: ${item.zone.name}  ·  ` : ''}
        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
      </Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketNum: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  title: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  meta: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
