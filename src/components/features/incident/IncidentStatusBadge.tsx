import { useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, BottomSheet } from '@/components/ui'
import { STATUS_META } from '@/constants/incident'
import { useUpdateIncidentStatus, useEndIncident } from '@/hooks/useIncident'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import type { TicketStatus } from '@/types/incident'

const FARMER_OPTIONS: { label: string; value: TicketStatus }[] = [
  { label: 'Mở', value: 'open' },
  { label: 'Đã giao', value: 'assigned' },
  { label: 'Đã giải quyết', value: 'resolved' },
]

interface Props {
  ticketId: string
  status: TicketStatus
  editable?: boolean
}

export function IncidentStatusBadge({ ticketId, status, editable = false }: Props) {
  const [visible, setVisible] = useState(false)
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIncidentStatus()
  const { mutate: endIncident, isPending: isEnding } = useEndIncident()
  const { showToast } = useToast()
  const meta = STATUS_META[status]
  const isPending = isUpdating || isEnding

  const handleSelect = (next: TicketStatus) => {
    setVisible(false)
    if (next === status) return

    const onError = (err: unknown) =>
      showToast.error({ message: getErrorMessage(err, 'Không thể cập nhật trạng thái') })

    if (next === 'resolved') {
      endIncident(ticketId, { onError })
    } else {
      updateStatus({ ticketId, status: next }, { onError })
    }
  }

  return (
    <>
      <Pressable
        onPress={() => editable && setVisible(true)}
        disabled={!editable || isPending}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          styles.badge,
          editable ? styles.badgeEditable : styles.badgeStatic,
          { backgroundColor: meta.bg },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.badgeText, { color: meta.color }]} numberOfLines={1}>
          {meta.label}
        </Text>
        {editable && (
          <MaterialIcons name='keyboard-arrow-down' size={14} color={meta.color} />
        )}
      </Pressable>

      {editable && (
        <BottomSheet visible={visible} onClose={() => setVisible(false)}>
          <BottomSheet.Header title='Trạng thái sự cố' onClose={() => setVisible(false)} />
          <BottomSheet.SelectOption
            data={FARMER_OPTIONS}
            keyExtractor={(item) => item.value}
            labelExtractor={(item) => item.label}
            valueExtractor={(item) => item.value}
            selectedValue={status}
            onSelect={(item) => handleSelect(item.value)}
          />
        </BottomSheet>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeEditable: { paddingLeft: 8, paddingRight: 4 },
  badgeStatic: { paddingHorizontal: 10 },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_500Medium',
  },
})
