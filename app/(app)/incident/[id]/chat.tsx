import { useState, useRef, useEffect } from 'react'
import {
  View, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Text, TopBar } from '@/components/ui'
import { useIncidentDetail } from '@/hooks/useIncident'
import { useDoctorIncidentDetail } from '@/hooks/useDoctor'
import { useAuth } from '@/hooks/useAuth'
import { useTicketMessages, useSendMessage } from '@/hooks/useTicketMessages'
import { useAuthStore } from '@/stores/authStore'
import { MessageBubble } from '@/components/features/incident/MessageBubble'
import type { TicketMessage } from '@/types/ticketMessage'

export default function IncidentChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const farmerQuery = useIncidentDetail(id)
  const doctorQuery = useDoctorIncidentDetail(id)
  const { data } = isDoctor ? doctorQuery : farmerQuery
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
      <TopBar title='Trao đổi' subtitle={data?.assignee?.fullName} />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
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
        </View>

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
            activeOpacity={0.85}
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexGrow: 1 },
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
    backgroundColor: '#2463EB', borderRadius: 24,
    paddingHorizontal: 22, height: 48, minWidth: 72,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
  sendBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
})
