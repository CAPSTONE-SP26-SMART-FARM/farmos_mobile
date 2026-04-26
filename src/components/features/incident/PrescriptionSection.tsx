import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { PrescriptionCard } from './PrescriptionCard'
import type { Prescription } from '@/types/prescription'

interface PrescriptionSectionProps {
  prescriptions: Prescription[]
  isLoading: boolean
  canPrescribe: boolean
  onAdd: () => void
}

export function PrescriptionSection({
  prescriptions, isLoading, canPrescribe, onAdd,
}: PrescriptionSectionProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Đơn thuốc</Text>
        {canPrescribe && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addText}>+ Kê đơn</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size='small' color='#2463EB' style={{ marginVertical: 12 }} />
      ) : prescriptions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {canPrescribe ? 'Chưa có đơn thuốc. Nhấn "+ Kê đơn" để thêm.' : 'Chưa có đơn thuốc.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {prescriptions.map((rx) => <PrescriptionCard key={rx.id} item={rx} />)}
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_500Medium' },
  addBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addText: { fontSize: 13, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
  list: { gap: 10 },
  empty: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
