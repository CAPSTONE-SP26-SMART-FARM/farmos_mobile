import { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatTime } from '@/utils/date'
import { getDefaultAvatar } from '@/constants/user'
import type { TicketMessage } from '@/types/ticketMessage'

interface Props {
  msg: TicketMessage
  isMe: boolean
  showAvatar: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
  senderRole?: string
}

const AVATAR_SIZE = 28
const AVATAR_GAP = 8

export function MessageBubble({ msg, isMe, showAvatar, isFirstInGroup, isLastInGroup, senderRole }: Props) {
  const [showTime, setShowTime] = useState(false)
  const time = formatTime(msg.createdAt)

  // Bo góc kiểu cụm tin: góc phía "đuôi" của cụm bo nhỏ lại.
  const bubbleRadius = isMe
    ? { borderTopRightRadius: isFirstInGroup ? 16 : 6, borderBottomRightRadius: isLastInGroup ? 16 : 6 }
    : { borderTopLeftRadius: isFirstInGroup ? 16 : 6, borderBottomLeftRadius: isLastInGroup ? 16 : 6 }

  return (
    <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
      {!isMe && (
        <View style={styles.avatarSlot}>
          {showAvatar && (
            <Image
              source={msg.sender.avatarUrl ? { uri: msg.sender.avatarUrl } : getDefaultAvatar(senderRole)}
              style={styles.avatar}
            />
          )}
        </View>
      )}

      <View style={[styles.bubbleWrap, isMe ? styles.alignRight : styles.alignLeft]}>
        <Pressable onPress={() => setShowTime((v) => !v)}>
          <View style={[styles.bubble, isMe ? styles.mine : styles.theirs, bubbleRadius]}>
            <Text style={[styles.text, isMe && styles.textMine]}>{msg.message}</Text>
          </View>
        </Pressable>
        {showTime && time ? (
          <Text style={[styles.time, isMe ? styles.timeRight : styles.timeLeft]}>{time}</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '88%' },
  rowLeft: { alignSelf: 'flex-start' },
  rowRight: { alignSelf: 'flex-end' },
  avatarSlot: { width: AVATAR_SIZE, marginRight: AVATAR_GAP, justifyContent: 'flex-end' },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#DCFCE7',
  },
  bubbleWrap: { flexShrink: 1 },
  alignLeft: { alignItems: 'flex-start' },
  alignRight: { alignItems: 'flex-end' },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { backgroundColor: '#15803D' },
  theirs: { backgroundColor: '#F3F4F6' },
  text: { fontSize: 14, lineHeight: 20, color: '#111827', fontFamily: 'Inter_400Regular' },
  textMine: { color: '#fff' },
  time: { fontSize: 10, color: '#9CA3AF', marginTop: 3, marginHorizontal: 4 },
  timeLeft: { textAlign: 'left' },
  timeRight: { textAlign: 'right' },
})
