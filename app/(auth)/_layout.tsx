import { Stack } from 'expo-router'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function AuthLayout() {
  useNetworkStatus()
  return <Stack screenOptions={{ headerShown: false }} />
}
