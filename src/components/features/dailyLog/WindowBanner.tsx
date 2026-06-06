import { View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { useDailyLogWindow } from '@/hooks/useDailyLog'
import { getWindowLabel } from '@/utils/dailyLogWindow'

interface Props {
  compact?: boolean
}

export function WindowBanner({ compact }: Props) {
  // Window snapshot + isOpen (auto-tick 30s) lấy từ useDailyLogWindow — không
  // còn hard-code 07-17 hay tự interval ở banner. Re-fetch khi 422 OutOfWindow.
  const { window, isOpen } = useDailyLogWindow()
  const label = getWindowLabel(window)

  return (
    <View style={[styles.row, isOpen ? styles.inOk : styles.outBad, compact && styles.compact]}>
      <MaterialIcons
        name={isOpen ? 'schedule' : 'lock-clock'}
        size={16}
        color={isOpen ? '#15803D' : '#B45309'}
      />
      <Text style={[styles.text, { color: isOpen ? '#15803D' : '#B45309' }]}>
        {isOpen
          ? `Đang trong giờ làm việc (${label})`
          : `Ngoài giờ làm việc — chỉ thao tác trong ${label}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  compact: { paddingVertical: 6 },
  inOk: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  outBad: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  text: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: 'Inter_500Medium',
  },
})
