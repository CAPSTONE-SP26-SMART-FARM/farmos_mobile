import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatDayHeader } from '@/utils/date'

export function ChatDaySeparator({ date }: { date: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.chip}>
        <Text style={styles.text}>{formatDayHeader(date)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 12 },
  chip: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: { fontSize: 11, color: '#6B7280', fontFamily: 'Inter_500Medium' },
})
