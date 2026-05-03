import { View, StyleSheet, Platform } from 'react-native'
import { Stack } from 'expo-router'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { ChatNotificationBanner } from '@/components/features/incident/ChatNotificationBanner'
import { NotificationBanner } from '@/components/features/notification/NotificationBanner'

const formSheetOptions = {
  presentation: 'formSheet' as const,
  headerShown: false,
  sheetGrabberVisible: true,
  sheetAllowedDetents: Platform.OS === 'ios' ? [1.0] : [0.9],
  contentStyle: { backgroundColor: '#F3F4F6' },
}

export default function AppLayout() {
  useNetworkStatus()
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='(tabs)' />
        <Stack.Screen name='incident/create' options={formSheetOptions} />
        <Stack.Screen name='incident/[id]/index' />
        <Stack.Screen name='incident/[id]/chat' />
        <Stack.Screen name='incident/[id]/resolve' options={formSheetOptions} />
        <Stack.Screen name='incident/[id]/select-medicine' options={formSheetOptions} />
        <Stack.Screen name='incident/[id]/custom-medicine' options={formSheetOptions} />
        <Stack.Screen name='incident/[id]/prescription' options={formSheetOptions} />
      </Stack>
      <NotificationBanner />
      <ChatNotificationBanner />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
