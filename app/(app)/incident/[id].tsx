import { useState, useRef, useEffect } from 'react'
import {
  View, ScrollView, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { useIncidentDetail } from '@/hooks/useIncident'
import { useTicketMessages, useSendMessage } from '@/hooks/useTicketMessages'
import { useAuthStore } from '@/stores/authStore'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import type { TicketMessage } from '@/types/ticketMessage'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function MessageBubble({ msg, isMe }: { msg: TicketMessage; isMe: boolean }) {
  return (
    <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isMe && (
        <Text style={styles.senderName}>{msg.sender.fullName}</Text>
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMine]}>{msg.message}</Text>
      </View>
      <Text style={[styles.bubbleTime, isMe && { textAlign: 'right' }]}>
        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading, isError } = useIncidentDetail(id)
  const { data: messagesData } = useTicketMessages(id)
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(id)
  const currentUser = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const messages = messagesData?.data ?? []

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isSending) return
    setInput('')
    sendMessage(text)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
      ) : isError || !data ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không thể tải thông tin sự cố.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Ticket info */}
          <ScrollView contentContainerStyle={styles.content} style={styles.infoScroll}>
            <Text style={styles.ticketNum}>{data.ticketNumber}</Text>
            <Text style={styles.title}>{data.title}</Text>

            <View style={styles.badges}>
              {[SEVERITY_META[data.severity], STATUS_META[data.status]].map((meta, i) => (
                <View key={i} style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{data.description}</Text>

            <Text style={styles.sectionTitle}>Thông tin</Text>
            <View style={styles.infoBox}>
              <Row label="Ưu tiên" value={data.priority} />
              {data.zone && <Row label="Khu vực" value={data.zone.name} />}
              {data.assignee && <Row label="Bác sĩ phụ trách" value={data.assignee.fullName} />}
              <Row label="Ngày tạo" value={new Date(data.createdAt).toLocaleString('vi-VN')} />
              <Row label="Cập nhật" value={new Date(data.updatedAt).toLocaleString('vi-VN')} />
            </View>
          </ScrollView>

          {/* Chat section */}
          <View style={styles.chatContainer}>
            <Text style={styles.chatTitle}>Trao đổi</Text>

            {!data.assignee ? (
              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>Chờ bác sĩ tiếp nhận...</Text>
              </View>
            ) : (
              <>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <MessageBubble msg={item} isMe={item.senderId === currentUser?.id} />
                  )}
                  contentContainerStyle={styles.messagesList}
                  ListEmptyComponent={
                    <Text style={styles.emptyChat}>Chưa có tin nhắn nào.</Text>
                  }
                  style={styles.messagesFlatList}
                />

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Nhập tin nhắn..."
                    placeholderTextColor="#9CA3AF"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    editable={!isSending}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!input.trim() || isSending}
                  >
                    <Text style={styles.sendBtnText}>Gửi</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  topBar: { paddingHorizontal: 20, paddingVertical: 14 },
  back: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },

  // Info section
  infoScroll: { flexShrink: 1 },
  content: { padding: 20, paddingBottom: 8 },
  ticketNum: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginBottom: 6 },
  title: { fontSize: 20, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 16 },
  description: { fontSize: 15, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 13, color: '#111827', fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },

  // Chat section
  chatContainer: {
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    backgroundColor: '#fff', paddingTop: 8,
  },
  chatTitle: {
    fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 16, paddingBottom: 6,
  },
  messagesFlatList: { maxHeight: 220 },
  messagesList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  emptyChat: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 16 },
  waitingBox: { paddingVertical: 20, alignItems: 'center' },
  waitingText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },

  // Bubbles
  bubbleWrap: { maxWidth: '75%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  senderName: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_500Medium', marginBottom: 2, marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: '#2463EB', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#111827', fontFamily: 'Inter_400Regular' },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#9CA3AF', marginTop: 2, marginHorizontal: 4 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  chatInput: {
    flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14,
    color: '#111827', fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA',
  },
  sendBtn: {
    backgroundColor: '#2463EB', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
  sendBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
})
