import { useEffect, useCallback, useState } from 'react'
import { LogBox } from 'react-native'
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
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { registerUnauthorizedHandler } from '@/services/api/client'
import { Toast, useToastState } from '@/components/ui/Toast'
import { AppContext } from '@/hooks/useToast'

LogBox.ignoreLogs(['SafeAreaView has been deprecated'])
SplashScreen.preventAutoHideAsync()
registerUnauthorizedHandler(() => useAuthStore.getState().logout())

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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && authChecked) await SplashScreen.hideAsync()
  }, [fontsLoaded, authChecked])

  if (!fontsLoaded || !authChecked) return null

  return (
    <AppContext.Provider value={{ showToast, hideToast }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name='(app)' options={{ animation: 'fade' }} />
              </Stack.Protected>
              <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name='(auth)' options={{ animation: 'fade' }} />
              </Stack.Protected>
            </Stack>
            {toast.visible && <Toast {...toast} onHide={hideToast} />}
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppContext.Provider>
  )
}
