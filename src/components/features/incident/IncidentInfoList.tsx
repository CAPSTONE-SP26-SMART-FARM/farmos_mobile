import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import type { IncidentTicket } from '@/types/incident'

interface IncidentInfoListProps {
  ticket: IncidentTicket
  isDoctor: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export function IncidentInfoList({ ticket, isDoctor }: IncidentInfoListProps) {
  return (
    <View style={styles.box}>
      <Row label='Ưu tiên' value={ticket.priority} />
      {ticket.zone && <Row label='Khu vực' value={ticket.zone.name} />}
      {ticket.farm && <Row label='Trang trại' value={ticket.farm.name} />}
      {isDoctor && ticket.creator && (
        <Row label='Farmer báo cáo' value={ticket.creator.fullName} />
      )}
      {!isDoctor && ticket.assignee && (
        <Row label='Bác sĩ phụ trách' value={ticket.assignee.fullName} />
      )}
      <Row label='Ngày tạo' value={formatDateTime(ticket.createdAt)} />
      <Row label='Cập nhật' value={formatDateTime(ticket.updatedAt)} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  value: { fontSize: 13, color: '#111827', fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
})
