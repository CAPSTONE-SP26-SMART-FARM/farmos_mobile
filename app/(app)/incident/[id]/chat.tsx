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
import { MessageBubble } from '@/components/features/incident/MessageBubble'
import type { TicketMessage } from '@/types/ticketMessage'

export default function IncidentChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data } = useIncidentDetail(id)
  const { data: messagesData, isLoading } = useTicketMessages(id)
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Trao đổi</Text>
          {data?.assignee && (
            <Text style={styles.topBarSub}>{data.assignee.fullName}</Text>
          )}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
        ) : (
          <FlatList<TicketMessage>
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble msg={item} isMe={item.senderId === currentUserId} />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có tin nhắn nào.{'\n'}Hãy bắt đầu cuộc trò chuyện!</Text>
              </View>
            )}
            contentContainerStyle={styles.messagesList}
            style={styles.flex}
            onContentSizeChange={() =>
              messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

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
            {isSending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendBtnText}>Gửi</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff',
  },
  back: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_500Medium', width: 60 },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  topBarSub: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 1 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexGrow: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff',
  },
  chatInput: {
    flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14,
    color: '#111827', fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA',
  },
  sendBtn: { backgroundColor: '#2463EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, minWidth: 52, alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
  sendBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
})
