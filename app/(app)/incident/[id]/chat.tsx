import { useState, useRef, useEffect, useMemo } from 'react'
import {
  View, Image, FlatList, ScrollView, TouchableOpacity, Pressable, TextInput,
  ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { ROLE_LABEL, getDefaultAvatar } from '@/constants/user'
import { useIncidentDetail } from '@/hooks/useIncident'
import { useDoctorIncidentDetail } from '@/hooks/useDoctor'
import { useAuth } from '@/hooks/useAuth'
import { useTicketMessages, useSendMessage } from '@/hooks/useTicketMessages'
import { useImagePicker } from '@/hooks/useImagePicker'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { MessageBubble } from '@/components/features/incident/MessageBubble'
import { ChatDaySeparator } from '@/components/features/incident/ChatDaySeparator'
import { toDateKey } from '@/utils/date'
import { uploadImageToCloudinary } from '@/utils/cloudinary'
import type { TicketMessage } from '@/types/ticketMessage'

const MAX_ATTACHMENTS = 5

// Gợi ý mở đầu hội thoại — khác nhau theo vai trò người dùng.
const DOCTOR_QUICK_REPLIES = [
  'Chào anh/chị, tôi đã xem qua sự cố.',
  'Anh/chị mô tả thêm tình trạng hiện tại giúp tôi nhé.',
  'Tình trạng này xuất hiện bao lâu rồi ạ?',
  'Anh/chị gửi giúp tôi vài hình ảnh thực tế nhé.',
]

const FARMER_QUICK_REPLIES = [
  'Chào bác sĩ, nhờ bác sĩ hỗ trợ ạ.',
  'Tình trạng đang lan rộng khá nhanh.',
  'Tôi nên xử lý thế nào trước mắt ạ?',
  'Cảm ơn bác sĩ nhiều!',
]

type ChatItem =
  | { type: 'day'; id: string; date: string }
  | {
      type: 'msg'
      id: string
      msg: TicketMessage
      isMe: boolean
      isFirstInGroup: boolean
      isLastInGroup: boolean
      showAvatar: boolean
    }

export default function IncidentChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const farmerQuery = useIncidentDetail(id)
  const doctorQuery = useDoctorIncidentDetail(id)
  const { data } = isDoctor ? doctorQuery : farmerQuery
  const { data: messagesData, isLoading } = useTicketMessages(id)
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(id)
  const { showToast } = useToast()
  const {
    imageUris: attachUris,
    pick: pickAttachments,
    remove: removeAttachment,
    reset: resetAttachments,
    canAdd: canAddAttachment,
  } = useImagePicker({ max: MAX_ATTACHMENTS })
  const [isUploading, setIsUploading] = useState(false)

  // Người đối thoại: doctor đang chat thì thấy farmer (creator), và ngược lại.
  const peer = isDoctor ? data?.creator : data?.assignee
  const peerName = peer?.fullName ?? 'Trao đổi'
  const peerRoleLabel = peer ? (ROLE_LABEL[peer.role] ?? peer.role) : ''
  // Sự cố đã đóng (farmer Close + Rate) hoặc bị huỷ → chat chuyển sang view-only.
  // Cả farmer + doctor đều không được gửi thêm tin nhắn.
  const isConversationEnded = data?.status === 'closed' || data?.status === 'cancelled'
  const endedReason: 'closed' | 'cancelled' | null =
    data?.status === 'closed' ? 'closed' : data?.status === 'cancelled' ? 'cancelled' : null
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [input, setInput] = useState('')
  const flatListRef = useRef<FlatList<ChatItem>>(null)
  const messages = useMemo(() => messagesData?.data ?? [], [messagesData?.data])

  // Build danh sách render: chèn mốc ngày + tính cờ cụm tin (avatar chỉ ở tin cuối cụm).
  const chatItems = useMemo<ChatItem[]>(() => {
    const items: ChatItem[] = []
    messages.forEach((msg, i) => {
      const prev = messages[i - 1]
      const next = messages[i + 1]
      const dayKey = toDateKey(msg.createdAt)

      if (!prev || toDateKey(prev.createdAt) !== dayKey) {
        items.push({ type: 'day', id: `day-${dayKey}-${msg.id}`, date: msg.createdAt })
      }

      const isMe = msg.senderId === currentUserId
      const samePrevSender = prev && prev.senderId === msg.senderId && toDateKey(prev.createdAt) === dayKey
      const sameNextSender = next && next.senderId === msg.senderId && toDateKey(next.createdAt) === dayKey

      items.push({
        type: 'msg',
        id: msg.id,
        msg,
        isMe,
        isFirstInGroup: !samePrevSender,
        isLastInGroup: !sameNextSender,
        showAvatar: !isMe && !sameNextSender, // avatar chỉ ở tin cuối của cụm người khác
      })
    })
    return items
  }, [messages, currentUserId])

  const hasText = input.trim().length > 0
  const sendRotate = useSharedValue(0)
  const sendScale = useSharedValue(1)

  useEffect(() => {
    if (hasText) {
      sendRotate.value = withSequence(withTiming(-18, { duration: 120 }), withSpring(0))
      sendScale.value = withSequence(withTiming(1.15, { duration: 120 }), withSpring(1))
    }
  }, [hasText, sendRotate, sendScale])

  const sendIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sendRotate.value}deg` }, { scale: sendScale.value }],
  }))

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  const hasAttachments = attachUris.length > 0
  const canSend =
    (input.trim().length > 0 || hasAttachments) && !isSending && !isUploading && !isConversationEnded

  const handleSend = async () => {
    const text = input.trim()
    if (!canSend) return
    // Race guard: socket `ticket.closed` có thể tới giữa lúc user gõ — chặn ở mutation entry.
    if (isConversationEnded) {
      showToast.info({ message: 'Sự cố đã đóng. Không thể gửi tin nhắn mới.' })
      return
    }

    // Snapshot rồi clear UI sớm để input không hold input/attachments khi mất mạng
    // — nếu upload fail, restore lại bằng cách throw + warn user.
    const localUris = [...attachUris]
    setInput('')
    resetAttachments()

    let attachments: { url: string }[] | undefined
    if (localUris.length > 0) {
      setIsUploading(true)
      try {
        const urls = await Promise.all(localUris.map(uploadImageToCloudinary))
        attachments = urls.map((url) => ({ url }))
      } catch {
        showToast.error({ message: 'Upload ảnh thất bại. Vui lòng thử lại.' })
        setInput(text)
        // Note: không restore attachments vì useImagePicker không expose set —
        // user phải pick lại. Acceptable trade-off cho retry path hiếm gặp.
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    sendMessage(
      { message: text || ' ', attachments },
      {
        onError: () => {
          showToast.error({ message: 'Gửi tin nhắn thất bại. Vui lòng thử lại.' })
          setInput(text)
        },
      },
    )
  }

  const handleQuickReply = (text: string) => {
    if (isSending || isUploading || isConversationEnded) return
    sendMessage({ message: text })
  }

  const quickReplies = isDoctor ? DOCTOR_QUICK_REPLIES : FARMER_QUICK_REPLIES
  const showQuickReplies = !isLoading && messages.length === 0 && !isConversationEnded

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnActive]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name='arrow-back-ios-new' size={22} color='#4B5563' />
        </Pressable>
        <Image
          source={peer?.avatarUrl ? { uri: peer.avatarUrl } : getDefaultAvatar(peer?.role)}
          style={styles.headerAvatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.headerName} numberOfLines={1}>
            {peerRoleLabel ? `${peerRoleLabel} ${peerName}` : peerName}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#15803D" />
          ) : (
            <FlatList<ChatItem>
              ref={flatListRef}
              data={chatItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) =>
                item.type === 'day' ? (
                  <ChatDaySeparator date={item.date} />
                ) : (
                  <MessageBubble
                    msg={item.msg}
                    isMe={item.isMe}
                    showAvatar={item.showAvatar}
                    isFirstInGroup={item.isFirstInGroup}
                    isLastInGroup={item.isLastInGroup}
                    senderRole={peer?.role}
                  />
                )
              }
              ListEmptyComponent={() => (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Chưa có tin nhắn nào.{'\n'}Hãy bắt đầu cuộc trò chuyện!</Text>
                </View>
              )}
              contentContainerStyle={styles.messagesList}
              style={styles.flex}
              onContentSizeChange={() =>
                chatItems.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}
        </View>

        {showQuickReplies && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps='always'
            style={styles.quickScroll}
            contentContainerStyle={styles.quickRow}
          >
            {quickReplies.map((text) => (
              <TouchableOpacity
                key={text}
                style={styles.quickChip}
                onPress={() => handleQuickReply(text)}
                disabled={isSending}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Attachment preview row (chỉ hiện khi user đã pick ảnh) */}
        {hasAttachments && !isConversationEnded ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps='always'
            style={styles.attachStrip}
            contentContainerStyle={styles.attachStripContent}
          >
            {attachUris.map((uri) => (
              <View key={uri} style={styles.attachItem}>
                <Image source={{ uri }} style={styles.attachItemImg} />
                <Pressable
                  style={styles.attachRemove}
                  onPress={() => removeAttachment(uri)}
                  hitSlop={6}
                >
                  <MaterialIcons name='close' size={14} color='#FFFFFF' />
                </Pressable>
                {isUploading ? (
                  <View style={styles.attachUploadOverlay}>
                    <ActivityIndicator size='small' color='#FFFFFF' />
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}

        {isConversationEnded ? (
          <View style={styles.endedBanner}>
            <MaterialIcons name='lock-outline' size={18} color='#6B7280' />
            <Text style={styles.endedBannerText}>
              {endedReason === 'cancelled'
                ? 'Sự cố đã huỷ. Không thể gửi tin nhắn mới.'
                : 'Sự cố đã đóng. Không thể gửi tin nhắn mới.'}
            </Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.attachBtn, !canAddAttachment && styles.attachBtnDisabled]}
              onPress={pickAttachments}
              disabled={!canAddAttachment || isUploading || isSending}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <MaterialIcons
                name='add-photo-alternate'
                size={26}
                color={canAddAttachment ? '#15803D' : '#9CA3AF'}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Nhắn tin..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isSending && !isUploading}
              multiline={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.85}
            >
              {isSending || isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Animated.View style={sendIconStyle}>
                  <MaterialIcons name="reply" size={24} color="#fff" style={styles.sendIcon} />
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnActive: { backgroundColor: '#F3F4F6' },
  headerAvatar: {
    width: 45, height: 45, borderRadius: 100,
    backgroundColor: '#DCFCE7',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, lineHeight: 22, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  body: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, gap: 3, flexGrow: 1 },
  quickScroll: { flexGrow: 0, flexShrink: 0 },
  quickRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    alignItems: 'center',
  },
  quickChip: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: 260,
  },
  quickChipText: { fontSize: 13, color: '#15803D', fontFamily: 'Inter_500Medium' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff',
  },
  chatInput: {
    flex: 1, minHeight: 48,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 14, fontSize: 15,
    color: '#111827', fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA',
  },
  sendBtn: {
    backgroundColor: '#15803D', borderRadius: 24,
    width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#A7D7B9' },
  sendIcon: { transform: [{ scaleX: -1 }] },

  // Attach button trong input row (góc trái input)
  attachBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  attachBtnDisabled: { opacity: 0.5 },

  // Strip thumbnails preview phía trên input row
  attachStrip: {
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  attachItem: { position: 'relative' },
  attachItemImg: {
    width: 64, height: 64, borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  attachRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  attachUploadOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Banner thay thế input row khi ticket đã closed / cancelled — view-only mode.
  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  endedBannerText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
})
