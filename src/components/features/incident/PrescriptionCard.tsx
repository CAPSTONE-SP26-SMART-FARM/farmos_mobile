import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import type { Prescription } from '@/types/prescription'

interface Props {
  item: Prescription
}

export function PrescriptionCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.medicineName}>{item.medicineName}</Text>
        <Text style={styles.duration}>{item.durationDays} ngày</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Liều dùng</Text>
        <Text style={styles.value}>{item.dosage}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tần suất</Text>
        <Text style={styles.value}>{item.frequency}</Text>
      </View>
      {item.withdrawalPeriodDays != null && (
        <View style={styles.row}>
          <Text style={styles.label}>Ngưng thuốc</Text>
          <Text style={styles.value}>{item.withdrawalPeriodDays} ngày</Text>
        </View>
      )}
      {item.instructions && (
        <View style={styles.instructions}>
          <Text style={styles.label}>Hướng dẫn</Text>
          <Text style={styles.instructionText}>{item.instructions}</Text>
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicineName: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: '#2463EB',
    fontFamily: 'Inter_500Medium',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
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
  instructions: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  instructionText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
})
