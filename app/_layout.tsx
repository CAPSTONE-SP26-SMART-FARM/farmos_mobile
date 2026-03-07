import '../global.css'
import { useEffect } from 'react'
import { LogBox } from 'react-native'
import { Stack } from 'expo-router'

LogBox.ignoreLogs(['SafeAreaView has been deprecated'])
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { registerUnauthorizedHandler } from '@/services/api/client'

// Đăng ký 1 lần ở module level — không cần re-register mỗi render
registerUnauthorizedHandler(() => useAuthStore.getState().logout())

function AppInit() {
  const fetchMe = useAuthStore(s => s.fetchMe)
  useNetworkStatus()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return null
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppInit />
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </QueryClientProvider>
  )
}
