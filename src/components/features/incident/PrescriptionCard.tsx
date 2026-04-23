import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import type { Prescription } from '@/types/prescription'

interface Props {
  item: Prescription
}

export function PrescriptionCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.medicineName}>{item.medicineName}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Liều dùng</Text>
        <Text style={styles.value}>{item.dosage}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Ngày kê</Text>
        <Text style={styles.value}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  medicineName: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Inter_500Medium',
    flex: 1,
    textAlign: 'right',
  },
})
