import { View, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import { Text, EmptyState } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { usePrescriptions } from '@/hooks/usePrescription'
import { icons } from '@/constants/icon'
import { isAiPrescription } from '@/types/prescription'
import type { Prescription } from '@/types/prescription'
import type { PrescriptionItemRes } from '@/types/medicine'

// Phần cố định phía trên vùng scroll (grabber + SheetHeader) trong formSheet.
// Trừ khỏi screenHeight để ScrollView biết đúng vùng scrollable — tránh case
// ScrollView flex:1 collapse về 0 trên iOS formSheet ở detent 1.0.
const HEADER_HEIGHT = 120

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

function PrescriptionBlock({ prescription, showHeader }: { prescription: Prescription; showHeader: boolean }) {
  const isAi = isAiPrescription(prescription)
  const items = prescription.items ?? []
  return (
    <View style={{ gap: 12 }}>
      {showHeader ? (
        <View style={styles.blockHeader}>
          <Text style={styles.blockHeaderTitle}>
            {isAi ? 'Đơn thuốc AI' : 'Đơn thuốc bác sĩ'}
          </Text>
          <Text style={styles.blockHeaderDate}>
            {dayjs(prescription.createdAt).format('DD/MM/YYYY HH:mm')}
          </Text>
        </View>
      ) : null}
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
      {prescription.generalNotes ? (
        <View style={styles.notesCard}>
          <Text style={styles.label}>Ghi chú chung</Text>
          <Text style={styles.usageText}>{prescription.generalNotes}</Text>
        </View>
      ) : null}
      {items.map((item) => <ItemRow key={item.id} item={item} />)}
    </View>
  )
}

export default function PrescriptionScreen() {
  const { id, rxId: rxIdParam } = useLocalSearchParams<{ id: string; rxId?: string }>()
  const router = useRouter()
  const { height: screenHeight } = useWindowDimensions()

  // BE đã populate full `items[]` trong list response (C2 done). 1 call list
  // đủ data cho mọi render — bỏ detail-fetch fallback.
  const { data: listData, isLoading } = usePrescriptions(id)
  const prescriptions = [...(listData?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  // User vào từ card cụ thể → ưu tiên prescription đó. Fallback (deep link
  // không kèm rxId) → prescription mới nhất.
  const prescription = rxIdParam
    ? prescriptions.find((p) => p.id === rxIdParam) ?? prescriptions[0]
    : prescriptions[0]
  const items = prescription?.items ?? []

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.container}>
      <SheetHeader
        title={`Đơn thuốc${items.length > 0 ? ` (${items.length})` : ''}`}
        onCancel={() => router.back()}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color='#15803D' />
          <Text style={styles.loadingText}>Đang tải đơn thuốc...</Text>
        </View>
      ) : !prescription ? (
        <EmptyState message='Chưa có đơn thuốc' Icon={icons.emptyCartSvg} />
      ) : (
        <ScrollView
          style={[styles.scrollView, { height: screenHeight - HEADER_HEIGHT }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <PrescriptionBlock prescription={prescription} showHeader={false} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: {},
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },

  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockHeaderTitle: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  blockHeaderDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },

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
