import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { BottomSheet, Text } from '@/components/ui'
import type { AbandonResolution } from '@/types/ticketLifecycle'

interface Props {
  visible: boolean
  isPending: boolean
  onClose: () => void
  onSelect: (resolution: AbandonResolution) => void
}

export function AbandonModal({ visible, isPending, onClose, onSelect }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheet.Header title='Bác sĩ chưa phản hồi' onClose={onClose} />

      <View style={styles.body}>
        <Text style={styles.desc}>
          Bác sĩ đã nhận ticket nhưng không phản hồi. Bạn muốn xử lý thế nào?
        </Text>

        <TouchableOpacity
          style={[styles.option, styles.optionAI]}
          onPress={() => onSelect('FALLBACK_AI')}
          disabled={isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.optionTitle}>Chuyển sang AI</Text>
          <Text style={styles.optionDesc}>AI sẽ phân tích và đưa ra giải pháp thay thế</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.optionRefund]}
          onPress={() => onSelect('REFUND_TICKET')}
          disabled={isPending}
          activeOpacity={0.8}
        >
          <Text style={[styles.optionTitle, { color: '#DC2626' }]}>Hoàn ticket</Text>
          <Text style={styles.optionDesc}>Ticket bị huỷ, quota được hoàn lại cho bạn</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  desc: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  optionAI: { borderColor: '#2463EB', backgroundColor: '#EFF6FF' },
  optionRefund: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  optionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#1D4ED8' },
  optionDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#6B7280' },
})
