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
    if (notif?.redirectUrl) {
      const m = notif.redirectUrl.match(/\/tickets\/([^/]+)/)
      if (m?.[1]) {
        router.push(`/(app)/incident/${m[1]}` as any)
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
        style={[styles.card, { borderLeftWidth: 4, borderLeftColor: meta.color }]}
        onPress={handlePress}
        activeOpacity={0.92}
      >
        <View style={[styles.icon, { backgroundColor: meta.bg }]}>
          <MaterialIcons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
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
  container: { position: 'absolute', left: 16, right: 16, zIndex: 9999 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 10,
  },
  icon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 14, lineHeight: 20, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 12, lineHeight: 16, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 2 },
})
