import { View, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { ChatNotificationBanner } from '@/components/features/incident/ChatNotificationBanner'

export default function AppLayout() {
  useNetworkStatus()
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
      <ChatNotificationBanner />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
