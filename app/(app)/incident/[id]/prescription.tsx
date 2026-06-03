import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, EmptyState } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useTicketFull } from '@/hooks/useTicketLifecycle'
import { icons } from '@/constants/icon'
import { AI_AUTHOR_ID } from '@/types/prescription'
import type { PrescriptionItemRes } from '@/types/medicine'

function ItemRow({ item }: { item: PrescriptionItemRes }) {
  const name = item.medicineName ?? item.customMedicineName ?? '—'
  return (
    <View style={styles.itemCard}>
      <Text style={styles.itemName}>{name}</Text>
      {item.withdrawalPeriodDays ? (
        <Text style={styles.warn}>⚠️ Thời gian ngừng: {item.withdrawalPeriodDays} ngày</Text>
      ) : null}
      <View style={styles.divider} />
      <Field label='Liều dùng' value={item.dosage} />
      <Field label='Tần suất' value={item.frequency} />
      {item.route ? <Field label='Đường dùng' value={item.route} /> : null}
      {item.durationDays ? <Field label='Số ngày' value={`${item.durationDays} ngày`} /> : null}
      <View style={styles.usageBlock}>
        <Text style={styles.label}>Hướng dẫn sử dụng</Text>
        <Text style={styles.usageText}>{item.usageInstructions}</Text>
      </View>
      {item.warnings ? (
        <View style={styles.usageBlock}>
          <Text style={styles.label}>Cảnh báo</Text>
          <Text style={styles.usageText}>{item.warnings}</Text>
        </View>
      ) : null}
    </View>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export default function PrescriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useTicketFull(id)
  const prescription = data?.prescription
  const items = prescription?.items ?? []
  const generalNotes = prescription?.generalNotes
  const isAi = prescription?.authorId === AI_AUTHOR_ID

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.container}>
      <SheetHeader title={`Đơn thuốc${items.length > 0 ? ` (${items.length})` : ''}`} onCancel={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color='#15803D' style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <EmptyState message='Chưa có đơn thuốc' Icon={icons.emptyCartSvg} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isAi ? (
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerHeader}>
                <MaterialIcons name='auto-awesome' size={18} color='#7C3AED' />
                <Text style={styles.aiBannerTitle}>Đơn thuốc gợi ý bởi AI</Text>
              </View>
              <Text style={styles.aiBannerBody}>
                Đây là đơn thuốc do AI sinh ra dựa trên mô tả sự cố — KHÔNG thay thế chỉ định của
                bác sĩ thú y có giấy phép. Vui lòng đối chiếu với chuyên gia trước khi sử dụng.
              </Text>
            </View>
          ) : null}
          {generalNotes ? (
            <View style={styles.notesCard}>
              <Text style={styles.label}>Ghi chú chung</Text>
              <Text style={styles.usageText}>{generalNotes}</Text>
            </View>
          ) : null}
          {items.map((item) => <ItemRow key={item.id} item={item} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 12 },

  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 8,
  },
  itemName: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  warn: { fontSize: 12, color: '#D97706', fontFamily: 'Inter_500Medium' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  label: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  value: { fontSize: 14, color: '#111827', fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },

  usageBlock: { gap: 4, marginTop: 4 },
  usageText: { fontSize: 14, lineHeight: 20, color: '#111827' },

  notesCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 6,
  },

  aiBanner: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 6,
  },
  aiBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBannerTitle: {
    fontSize: 14,
    color: '#5B21B6',
    fontFamily: 'Inter_600SemiBold',
  },
  aiBannerBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5B21B6',
    fontFamily: 'Inter_400Regular',
  },
})
