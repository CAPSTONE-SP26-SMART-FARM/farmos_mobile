import { Stack } from 'expo-router'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function AppLayout() {
  useNetworkStatus()
  return <Stack screenOptions={{ headerShown: false }} />
}
