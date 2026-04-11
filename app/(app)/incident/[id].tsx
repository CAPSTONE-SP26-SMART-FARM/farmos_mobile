import { useState, useRef, useEffect } from 'react'
import {
  View, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { useIncidentDetail } from '@/hooks/useIncident'
import { useTicketMessages, useSendMessage } from '@/hooks/useTicketMessages'
import { useAuthStore } from '@/stores/authStore'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import { MessageBubble } from '@/components/features/incident/MessageBubble'
import type { IncidentTicket } from '@/types/incident'
import type { TicketMessage } from '@/types/ticketMessage'

// ── Sub-components ────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function IncidentInfoHeader({ data }: { data: IncidentTicket }) {
  return (
    <View style={styles.infoSection}>
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

      <View style={styles.chatDivider}>
        <Text style={styles.chatTitle}>Trao đổi</Text>
      </View>

      {!data.assignee && (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>⏳ Chờ bác sĩ tiếp nhận...</Text>
        </View>
      )}
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading, isError } = useIncidentDetail(id)
  const { data: messagesData } = useTicketMessages(id)
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(id)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [input, setInput] = useState('')
  const flatListRef = useRef<FlatList<TicketMessage>>(null)
  const messages = messagesData?.data ?? []

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isSending) return
    setInput('')
    sendMessage(text)
  }

  const topBar = (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Quay lại</Text>
      </TouchableOpacity>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        {topBar}
        <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        {topBar}
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không thể tải thông tin sự cố.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {topBar}
      {/* KeyboardAvoidingView bọc toàn bộ nội dung — không bọc riêng FlatList */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList<TicketMessage>
          ref={flatListRef}
          data={data.assignee ? messages : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isMe={item.senderId === currentUserId} />
          )}
          ListHeaderComponent={() => <IncidentInfoHeader data={data} />}
          ListEmptyComponent={
            data.assignee
              ? () => <Text style={styles.emptyChat}>Chưa có tin nhắn nào.</Text>
              : null
          }
          contentContainerStyle={styles.messagesList}
          style={styles.flex}
          onContentSizeChange={() =>
            messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {data.assignee && (
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
              multiline={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isSending}
            >
              <Text style={styles.sendBtnText}>Gửi</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  back: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  infoSection: { padding: 20, paddingBottom: 0 },
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
  chatDivider: { marginTop: 24, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  chatTitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold' },
  messagesList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  emptyChat: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 16, paddingHorizontal: 16 },
  waitingBox: { paddingVertical: 24, alignItems: 'center', paddingBottom: 32 },
  waitingText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#111827', fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA' },
  sendBtn: { backgroundColor: '#2463EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
  sendBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
})
