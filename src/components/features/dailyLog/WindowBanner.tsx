import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import {
  getWindowLabel,
  isWithinDailyLogWindow,
} from '@/utils/dailyLogWindow'

interface Props {
  /** Auto re-check mỗi phút để banner đổi trạng thái khi qua 17:00. */
  pollIntervalMs?: number
  compact?: boolean
}

export function WindowBanner({ pollIntervalMs = 60_000, compact }: Props) {
  const [inWindow, setInWindow] = useState(isWithinDailyLogWindow())

  useEffect(() => {
    const id = setInterval(() => setInWindow(isWithinDailyLogWindow()), pollIntervalMs)
    return () => clearInterval(id)
  }, [pollIntervalMs])

  const label = getWindowLabel()

  return (
    <View style={[styles.row, inWindow ? styles.inOk : styles.outBad, compact && styles.compact]}>
      <MaterialIcons
        name={inWindow ? 'schedule' : 'lock-clock'}
        size={16}
        color={inWindow ? '#15803D' : '#B45309'}
      />
      <Text style={[styles.text, { color: inWindow ? '#15803D' : '#B45309' }]}>
        {inWindow
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
