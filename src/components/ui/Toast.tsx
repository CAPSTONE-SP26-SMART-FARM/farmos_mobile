import React, { useState, useCallback, useRef } from 'react'
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native'
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type ToastType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'network_offline'
  | 'network_online'

export interface ToastOptions {
  type: ToastType
  title?: string
  message?: string
  duration?: number
  bottomOffset?: number
}

const TOKENS: Record<ToastType, any> = {
  success: {
    bg: '#0F172A',
    icon: 'checkmark-circle-outline',
    accent: '#10B981',
    vessel: 'rgba(16, 185, 129, 0.15)',
    message: 'Thao tác đã được thực hiện'
  },
  error: {
    bg: '#1E293B',
    icon: 'alert-circle-outline',
    accent: '#EF4444',
    vessel: 'rgba(239, 68, 68, 0.15)',
    message: 'Đã có lỗi xảy ra'
  },
  warning: {
    bg: '#1E293B',
    icon: 'warning-outline',
    accent: '#F59E0B',
    vessel: 'rgba(245, 158, 11, 0.15)',
    message: 'Vui lòng kiểm tra lại'
  },
  info: {
    bg: '#0F172A',
    icon: 'information-circle-outline',
    accent: '#3B82F6',
    vessel: 'rgba(59, 130, 246, 0.15)',
    message: 'Thông tin bổ sung cho bạn'
  },
  network_offline: {
    bg: '#1E293B',
    icon: 'wifi-outline',
    accent: '#EF4444',
    vessel: 'rgba(239, 68, 68, 0.15)',
    showDot: true,
    message: 'Mất kết nối Internet, vui lòng kiểm tra lại'
  },
  network_online: {
    bg: '#0F172A',
    icon: 'wifi-outline',
    accent: '#10B981',
    vessel: 'rgba(16, 185, 129, 0.15)',
    message: 'Đã khôi phục kết nối'
  }
}

export const useToastState = () => {
  const [toast, setToast] = useState<{ visible: boolean } & ToastOptions>({
    visible: false,
    type: 'info'
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  const showToast = useCallback(
    ({ type, title, message, duration = 3500, bottomOffset }: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setToast({ visible: true, type, title, message, bottomOffset })
      timerRef.current = setTimeout(hideToast, duration)
    },
    [hideToast]
  )

  return { toast, showToast, hideToast }
}

export interface ToastProps extends ToastOptions {
  onHide: () => void
}

export const Toast = ({ type, message, onHide, bottomOffset }: ToastProps) => {
  const insets = useSafeAreaInsets()
  const theme = TOKENS[type]

  return (
    <Animated.View
      entering={SlideInDown.duration(700).springify().damping(28).stiffness(85)}
      exiting={SlideOutDown.duration(400)}
      style={[styles.wrapper, { bottom: insets.bottom + (bottomOffset ?? 60) }]}
    >
      <View style={[styles.card, { backgroundColor: theme.bg }]}>
        <View style={[styles.vessel, { backgroundColor: theme.vessel }]}>
          <Ionicons name={theme.icon} size={18} color={theme.accent} />
          {theme.showDot && <View style={styles.errorDot} />}
        </View>

        <View style={styles.content}>
          <Text style={styles.sub}>{message || theme.message}</Text>
        </View>

        <Pressable
          onPress={onHide}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          hitSlop={15}
        >
          <Ionicons name='close' size={16} color='rgba(255, 255, 255, 0.4)' />
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 16, right: 16, zIndex: 99999 },
  card: {
    padding: 10,
    paddingRight: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10
      },
      android: { elevation: 8 }
    })
  },
  vessel: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  errorDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#1E293B'
  },
  content: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  sub: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  closeBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  pressed: { opacity: 0.5 }
})
