import { useEffect, useRef, useState, useCallback } from 'react'
import { Animated, TouchableOpacity, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, usePathname } from 'expo-router'
import { Text } from '@/components/ui'
import { socketService } from '@/services/socket/socketService'
import { useAuthStore } from '@/stores/authStore'

type MessageNotif = {
  ticketId: string
  senderName: string
}

const HIDDEN_Y = -120
const AUTO_DISMISS_MS = 4000

export function ChatNotificationBanner() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [notif, setNotif] = useState<MessageNotif | null>(null)

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: HIDDEN_Y,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [translateY])

  const show = useCallback((incoming: MessageNotif) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setNotif(incoming)
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS)
  }, [translateY, dismiss])

  useEffect(() => {
    const handler = (payload: { ticketId: string; senderId: string; senderName: string }) => {
      if (payload.senderId === currentUserId) return
      if (pathname.includes(`/incident/${payload.ticketId}/chat`)) return
      show({ ticketId: payload.ticketId, senderName: payload.senderName })
    }
    socketService.on('ticket.message.created', handler)
    return () => {
      socketService.off('ticket.message.created', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, currentUserId, show])

  const handlePress = () => {
    if (!notif?.ticketId) return
    dismiss()
    router.push(`/(app)/incident/${notif.ticketId}/chat` as any)
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + (Platform.OS === 'android' ? 8 : 4), transform: [{ translateY }] },
      ]}
      pointerEvents='box-none'
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.92}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>💬</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {notif?.senderName ?? ''}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>Vừa gửi tin nhắn • Nhấn để xem</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, zIndex: 9999 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1F2937', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
  },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center',
  },
  iconText: { fontSize: 20 },
  body: { flex: 1 },
  name: { fontSize: 14, color: '#F9FAFB', fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
})
