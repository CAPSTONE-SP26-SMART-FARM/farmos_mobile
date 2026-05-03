import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { STATUS_META } from '@/constants/incident'
import type { TicketStatus } from '@/types/incident'

interface Props {
  status: TicketStatus
}

export function IncidentStatusBadge({ status }: Props) {
  const meta = STATUS_META[status]
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.color }]} numberOfLines={1}>
        {meta.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_500Medium' },
})
