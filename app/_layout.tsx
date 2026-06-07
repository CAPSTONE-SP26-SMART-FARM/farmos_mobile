import { useEffect, useCallback, useState } from 'react'
import { LogBox, AppState, type AppStateStatus, Platform } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_600SemiBold_Italic,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter'
import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query'
import NetInfo from '@react-native-community/netinfo'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { registerUnauthorizedHandler } from '@/services/api/client'
import { Toast, useToastState } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui'
import { AppContext } from '@/hooks/useToast'
import { socketService } from '@/services/socket/socketService'
import { NotificationBanner } from '@/components/features/notification/NotificationBanner'
import { ChatNotificationBanner } from '@/components/features/incident/ChatNotificationBanner'
import { useGlobalIncidentRealtime } from '@/hooks/useGlobalIncidentRealtime'
import { useGlobalDoctorRealtime } from '@/hooks/useGlobalDoctorRealtime'
import { useGlobalFarmerRealtime } from '@/hooks/useGlobalFarmerRealtime'
import { useDoctorOnlineNudge } from '@/hooks/useDoctorOnlineNudge'

LogBox.ignoreLogs(['SafeAreaView has been deprecated'])
SplashScreen.preventAutoHideAsync()
registerUnauthorizedHandler(() => {
  socketService.disconnect()
  useAuthStore.getState().logout()
})

// Bridge React Query focusManager với AppState — RN không có `window.focus`,
// nên `refetchOnWindowFocus` mặc định không bao giờ kick. Sau bridge này, mọi
// query stale sẽ refetch khi app từ background → foreground (vd farmer mở app
// lại sau khi manager đã tạo task).
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active')
}

// Bridge online status — query bị paused offline sẽ tự resume khi mạng trở lại.
onlineManager.setEventListener((setOnline) => {
  const sub = NetInfo.addEventListener((state) => setOnline(!!state.isConnected))
  return () => sub()
})

function GlobalRealtimeBridge() {
  useGlobalIncidentRealtime()
  useGlobalDoctorRealtime()
  useGlobalFarmerRealtime()
  useDoctorOnlineNudge()
  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_400Regular_Italic,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_600SemiBold_Italic,
    Inter_700Bold,
  })

  const fetchMe = useAuthStore((s) => s.fetchMe)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [authChecked, setAuthChecked] = useState(false)
  const { toast, showToast, hideToast } = useToastState()

  useEffect(() => {
    fetchMe().finally(() => setAuthChecked(true))
  }, [fetchMe])

  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect()
    } else {
      socketService.disconnect()
    }
  }, [isAuthenticated])

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && authChecked) await SplashScreen.hideAsync()
  }, [fontsLoaded, authChecked])

  if (!fontsLoaded || !authChecked) return null

  return (
    <AppContext.Provider value={{ showToast, hideToast }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <ConfirmProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={isAuthenticated}>
                  <Stack.Screen name='(app)' options={{ animation: 'fade' }} />
                </Stack.Protected>
                <Stack.Protected guard={!isAuthenticated}>
                  <Stack.Screen name='(auth)' options={{ animation: 'fade' }} />
                </Stack.Protected>
              </Stack>
              {/* Banners return null until a notification arrives — no native views at startup */}
              <NotificationBanner />
              <ChatNotificationBanner />
              {/* Root-level realtime — popup fallback AI hoạt động kể cả khi user chưa từng mở tab Incidents (lazy mount). */}
              <GlobalRealtimeBridge />
              {toast.visible && <Toast {...toast} onHide={hideToast} />}
            </ConfirmProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppContext.Provider>
  )
}
