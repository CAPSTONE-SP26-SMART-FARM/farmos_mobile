import { Pressable, View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import { Text } from '@/components/ui'
import { isAiPrescription, type Prescription } from '@/types/prescription'

interface Props {
  item: Prescription
  onPress?: () => void
}

export function PrescriptionCard({ item, onPress }: Props) {
  const Wrapper: any = onPress ? Pressable : View
  const isAi = isAiPrescription(item)

  // Ưu tiên top-level summary (BE list trả về); fallback sang item đầu tiên (khi BE chỉ trả items[]).
  const firstItem = item.items?.[0]
  const displayName =
    item.medicineName ?? firstItem?.medicineName ?? firstItem?.customMedicineName ?? '—'
  const displayDosage = item.dosage ?? firstItem?.dosage ?? '—'
  const extraCount = item.items && item.items.length > 1 ? item.items.length - 1 : 0

  return (
    <Wrapper
      style={({ pressed }: { pressed?: boolean }) => [
        styles.card,
        isAi && styles.cardAi,
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={styles.titleRow}>
        <Text style={styles.medicineName} numberOfLines={1}>
          {displayName}
          {extraCount > 0 ? (
            <Text style={styles.extraCount}> +{extraCount} thuốc khác</Text>
          ) : null}
        </Text>
        {isAi ? (
          <View style={styles.aiBadge}>
            <MaterialIcons name='auto-awesome' size={12} color='#7C3AED' />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        ) : null}
        {onPress ? <MaterialIcons name='chevron-right' size={20} color='#9CA3AF' /> : null}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Liều dùng</Text>
        <Text style={styles.value}>{displayDosage}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Ngày kê</Text>
        <Text style={styles.value}>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
      </View>
      {isAi ? (
        <Text style={styles.aiNotice} numberOfLines={2}>
          ⚠️ Đơn gợi ý bởi AI — không thay thế chỉ định của bác sĩ có giấy phép.
        </Text>
      ) : null}
    </Wrapper>
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
  cardAi: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  medicineName: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  extraCount: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
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
  aiNotice: {
    fontSize: 11,
    lineHeight: 15,
    color: '#7C3AED',
    fontFamily: 'Inter_500Medium',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
})
