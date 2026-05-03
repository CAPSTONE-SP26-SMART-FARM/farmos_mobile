import { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheet, Text, TextField, PrimaryButton, SecondaryButton } from '@/components/ui'

interface Props {
  visible: boolean
  isClosing: boolean
  isRating: boolean
  onClose: () => void
  onSubmit: (stars: number, feedback: string) => void
}

export function CloseRateModal({ visible, isClosing, isRating, onClose, onSubmit }: Props) {
  const [stars, setStars] = useState(0)
  const [feedback, setFeedback] = useState('')
  const isPending = isClosing || isRating

  const handleSubmit = () => onSubmit(stars, feedback.trim())

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheet.Header title='Đóng & đánh giá sự cố' onClose={onClose} />

      <View style={styles.body}>
        <Text style={styles.label}>Đánh giá bác sĩ (tuỳ chọn)</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setStars(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <MaterialIcons
                name={s <= stars ? 'star' : 'star-border'}
                size={36}
                color={s <= stars ? '#F59E0B' : '#D1D5DB'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {stars > 0 && (
          <TextField
            label='Nhận xét (tuỳ chọn)'
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
            showClear={false}
            containerStyle={styles.feedbackInput}
          />
        )}

        <View style={styles.actions}>
          <PrimaryButton
            title={isPending ? '' : 'Xác nhận đóng'}
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
            style={styles.confirmBtn}
            icon={isPending ? <ActivityIndicator color='#fff' size='small' /> : undefined}
          />
          <SecondaryButton title='Huỷ' onPress={onClose} disabled={isPending} />
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  label: { fontSize: 14, color: '#374151', fontFamily: 'Inter_500Medium' },
  stars: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 8 },
  feedbackInput: {},
  actions: { gap: 10 },
  confirmBtn: {},
})
