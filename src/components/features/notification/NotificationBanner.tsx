import { useEffect, useRef, useState, useCallback } from 'react'
import { Animated, TouchableOpacity, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, usePathname } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Text } from '@/components/ui'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'

type IncomingNotif = {
  type: string
  title: string
  content: string
  redirectUrl?: string | null
  ticketId?: string
}

const HIDDEN_Y = -160
const AUTO_DISMISS_MS = 4500

const TYPE_ICON: Record<string, string> = {
  incident_accepted: '🩺',
  incident_assigned: '📋',
  prescription_created: '💊',
  production_request_replied: '✅',
  production_request_created: '📤',
  alert_triggered: '⚠️',
  system: '🔔',
}

export function NotificationBanner() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()

  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [notif, setNotif] = useState<IncomingNotif | null>(null)

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: HIDDEN_Y,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [translateY])

  const show = useCallback(
    (incoming: IncomingNotif) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setNotif(incoming)
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS)
    },
    [translateY, dismiss],
  )

  useEffect(() => {
    const handler = (payload: IncomingNotif) => {
      // Invalidate notification list để tab Thông báo refetch
      qc.invalidateQueries({ queryKey: ['notifications'] })

      // Nếu noti gắn với ticket → invalidate incident queries để detail/list cập nhật status
      if (payload.ticketId) {
        qc.invalidateQueries({ queryKey: queryKeys.incident.detail(payload.ticketId) })
        qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(payload.ticketId) })
        qc.invalidateQueries({ queryKey: ['incident', 'list'] })
        qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
      }

      // Đang ở chính màn liên quan thì không cần banner
      if (payload.ticketId && pathname.includes(`/incident/${payload.ticketId}`)) return
      if (pathname.includes('/(tabs)/notifications')) return

      show(payload)
    }
    socketService.on('notification.created', handler)
    return () => {
      socketService.off('notification.created', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, qc, show])

  const handlePress = () => {
    dismiss()
    if (notif?.redirectUrl) {
      // /tickets/:id (BE) → /(app)/incident/:id (FE)
      const m = notif.redirectUrl.match(/\/tickets\/([^/]+)/)
      if (m?.[1]) {
        router.push(`/(app)/incident/${m[1]}` as any)
        return
      }
    }
    router.push('/(app)/(tabs)/notifications')
  }

  const icon = TYPE_ICON[notif?.type ?? 'system'] ?? '🔔'

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
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {notif?.title ?? ''}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {notif?.content ?? ''}
          </Text>
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
  title: { fontSize: 14, color: '#F9FAFB', fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 16 },
})
