import { useEffect, useRef, useState, useCallback } from 'react'
import { Animated, TouchableOpacity, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, usePathname } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import { resolveNotificationIcon } from '@/utils/notification'
import { capitalize, shortAlertTitle, shortAlertContent } from '@/utils/text'

type IncomingNotif = {
  type: string
  title: string
  content: string
  redirectUrl?: string | null
  ticketId?: string
}

const HIDDEN_Y = -160
const AUTO_DISMISS_MS = 4500

export function NotificationBanner() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()

  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [notif, setNotif] = useState<IncomingNotif | null>(null)

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    Animated.timing(translateY, {
      toValue: HIDDEN_Y,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setNotif(null))
  }, [translateY])

  // Animate in when a new notif arrives
  useEffect(() => {
    if (!notif) return
    translateY.setValue(HIDDEN_Y)
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [notif])

  useEffect(() => {
    const handler = (payload: IncomingNotif) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      if (payload.ticketId) {
        qc.invalidateQueries({ queryKey: queryKeys.incident.detail(payload.ticketId) })
        qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(payload.ticketId) })
        qc.invalidateQueries({ queryKey: ['incident', 'list'] })
        qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
      }
      if (payload.ticketId && pathname.includes(`/incident/${payload.ticketId}`)) return
      if (pathname.includes('/(tabs)/notifications')) return
      setNotif(payload)
    }
    socketService.on('notification.created', handler)
    return () => {
      socketService.off('notification.created', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, qc])

  const handlePress = () => {
    dismiss()
    // BE convention (round 3): redirect URL là path tuyệt đối mobile-friendly:
    //   /tickets/<id>                      → incident detail
    //   /wallet                            → doctor wallet
    //   /wallet/withdrawal/<id>            → withdrawal detail
    //   /alerts/<id>                       → alert (chưa có detail screen, route về tab Alerts)
    const url = notif?.redirectUrl ?? ''
    if (url) {
      const ticketMatch = url.match(/^\/tickets\/([^/]+)/)
      if (ticketMatch?.[1]) {
        router.push(`/(app)/incident/${ticketMatch[1]}` as any)
        return
      }
      const withdrawalMatch = url.match(/^\/wallet\/withdrawal\/([^/]+)/)
      if (withdrawalMatch?.[1]) {
        router.push(`/(app)/withdrawal/${withdrawalMatch[1]}` as any)
        return
      }
      if (url === '/wallet' || url.startsWith('/wallet')) {
        router.push('/(app)/wallet' as any)
        return
      }
      if (url.startsWith('/alerts')) {
        router.push('/(app)/(tabs)/alerts')
        return
      }
    }
    if (notif?.type === 'sensor_alert' || notif?.type === 'alert_triggered') {
      router.push('/(app)/(tabs)/alerts')
      return
    }
    router.push('/(app)/(tabs)/notifications')
  }

  // Return null when idle — no native views = no layout interference
  if (!notif) return null

  const meta = resolveNotificationIcon(notif.type, notif.title)

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + (Platform.OS === 'android' ? 8 : 4), transform: [{ translateY }] },
      ]}
      pointerEvents='box-none'
    >
      <TouchableOpacity
        style={[
          styles.card,
          // Banner sáng + có nhận diện: bg tinted theo meta.bg, accent border
          // dày hơn, không còn xám flat. Title đậm, subtitle đủ contrast.
          { backgroundColor: meta.bg, borderColor: meta.color },
        ]}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <View style={[styles.icon, { backgroundColor: '#FFFFFF' }]}>
          <MaterialIcons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: meta.color }]} numberOfLines={1}>
            {capitalize(shortAlertTitle(notif.title))}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {capitalize(shortAlertContent(notif.content))}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 12, right: 12, zIndex: 9999 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
    borderWidth: 1.5,
    // Shadow đậm hơn để banner nổi rõ trên mọi background — đặc biệt trên list
    // / screen có nhiều card khác.
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
  },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    // White circle có shadow nhẹ — pop khỏi tinted background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  body: { flex: 1 },
  // Title dùng accent color của type (vd đỏ cho alert, xanh cho ticket) →
  // tăng nhận diện. Subtitle dùng màu tối (#1F2937) thay vì xám flat #6B7280.
  title: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, lineHeight: 18, color: '#1F2937', fontFamily: 'Inter_500Medium', marginTop: 2 },
})
