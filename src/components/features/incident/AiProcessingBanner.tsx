import { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Text } from '@/components/ui'

/**
 * Banner hiển thị ở detail screen khi user vừa chọn fallback sang AI.
 * Show liên tục cho tới khi socket `ticket.ai.resolved` đến (hook ngoài clear flag).
 */
export function AiProcessingBanner() {
  const sparkle = useSharedValue(0)

  useEffect(() => {
    sparkle.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [sparkle])

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + sparkle.value * 0.6,
    transform: [{ scale: 0.9 + sparkle.value * 0.2 }],
  }))

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={sparkleStyle}>
          <MaterialIcons name='auto-awesome' size={22} color='#7C3AED' />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI đang phân tích sự cố</Text>
          <Text style={styles.subtitle}>
            Vui lòng chờ trong giây lát — giải pháp sẽ tự động hiển thị tại đây khi sẵn sàng.
          </Text>
        </View>
        <ActivityIndicator color='#7C3AED' />
      </View>

      <View style={styles.steps}>
        <StepRow text='Đang đọc mô tả & ảnh đính kèm' done />
        <StepRow text='Đối chiếu lịch sử canh tác' done />
        <StepRow text='Sinh giải pháp & đơn thuốc đề xuất' active />
      </View>

      <Text style={styles.hint}>
        Thời gian xử lý thông thường: 10–60 giây. Bạn có thể rời màn này — kết quả sẽ tự cập nhật.
      </Text>
    </View>
  )
}

function StepRow({ text, done, active }: { text: string; done?: boolean; active?: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View
        style={[
          styles.stepDot,
          done && styles.stepDotDone,
          active && styles.stepDotActive,
        ]}
      >
        {done ? (
          <MaterialIcons name='check' size={12} color='#FFFFFF' />
        ) : active ? (
          <ActivityIndicator size='small' color='#7C3AED' />
        ) : null}
      </View>
      <Text
        style={[
          styles.stepText,
          done && styles.stepTextDone,
          active && styles.stepTextActive,
        ]}
      >
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_600SemiBold',
    color: '#5B21B6',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  steps: { gap: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  stepDotActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  stepTextDone: {
    color: '#374151',
    fontFamily: 'Inter_500Medium',
  },
  stepTextActive: {
    color: '#5B21B6',
    fontFamily: 'Inter_500Medium',
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
})
