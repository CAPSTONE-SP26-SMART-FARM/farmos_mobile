import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatTime } from '@/utils/date'
import type { TicketMessage } from '@/types/ticketMessage'

interface Props {
  msg: TicketMessage
  isMe: boolean
}

export function MessageBubble({ msg, isMe }: Props) {
  const time = formatTime(msg.createdAt)

  return (
    <View style={[styles.wrap, isMe ? styles.right : styles.left]}>
      {!isMe && <Text style={styles.sender}>{msg.sender.fullName}</Text>}
      <View style={[styles.bubble, isMe ? styles.mine : styles.theirs]}>
        <Text style={[styles.text, isMe && styles.textMine]}>{msg.message}</Text>
      </View>
      {time ? (
        <Text style={[styles.time, isMe && { textAlign: 'right' }]}>{time}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '75%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  sender: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_500Medium', marginBottom: 2, marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { backgroundColor: '#2463EB', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  text: { fontSize: 14, color: '#111827', fontFamily: 'Inter_400Regular' },
  textMine: { color: '#fff' },
  time: { fontSize: 10, color: '#9CA3AF', marginTop: 2, marginHorizontal: 4 },
})
