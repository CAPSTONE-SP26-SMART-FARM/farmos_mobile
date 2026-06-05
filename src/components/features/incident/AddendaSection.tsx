import { View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import { Text } from '@/components/ui'
import type { TicketAddendum } from '@/services/api/ticketLifecycle'

interface AddendaSectionProps {
  addenda: TicketAddendum[]
}

const TYPE_LABEL: Record<TicketAddendum['type'], string> = {
  SOLUTION_NOTE: 'Ghi chú giải pháp',
  PRESCRIPTION_NOTE: 'Ghi chú đơn thuốc',
  CORRECTION: 'Đính chính',
}

export function AddendaSection({ addenda }: AddendaSectionProps) {
  if (!addenda || addenda.length === 0) return null

  const sorted = [...addenda].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <View>
      <Text style={styles.sectionLabel}>Ghi chú bổ sung ({sorted.length})</Text>
      <View style={styles.list}>
        {sorted.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.header}>
              <MaterialIcons name='sticky-note-2' size={16} color='#15803D' />
              <Text style={styles.type}>{TYPE_LABEL[item.type] ?? item.type}</Text>
              <Text style={styles.date}>
                {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            {item.author?.fullName ? (
              <Text style={styles.author}>— {item.author.fullName}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  list: { gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#15803D',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  type: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  date: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
  },
  author: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_500Medium' },
})
