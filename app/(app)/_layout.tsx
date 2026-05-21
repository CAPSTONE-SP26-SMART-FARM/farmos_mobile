import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name='(tabs)' />
      <Stack.Screen name='farm/milestone/[milestoneId]' />
      <Stack.Screen name='incident/create' options={formSheetOptions} />
      <Stack.Screen name='incident/[id]/index' />
      <Stack.Screen name='incident/[id]/chat' />
      <Stack.Screen name='incident/[id]/resolve' options={formSheetOptions} />
      <Stack.Screen name='incident/[id]/select-medicine' options={formSheetOptions} />
      <Stack.Screen name='incident/[id]/custom-medicine' options={formSheetOptions} />
      <Stack.Screen name='incident/[id]/prescription' options={formSheetOptions} />
      <Stack.Screen name='bank-accounts/index' />
      <Stack.Screen name='bank-accounts/form' options={formSheetOptions} />
      <Stack.Screen name='withdrawal/index' />
      <Stack.Screen name='withdrawal/[id]' />
      <Stack.Screen name='withdrawal/new' options={formSheetOptions} />
      <Stack.Screen name='edit-doctor-profile' />
      <Stack.Screen name='farmer-profile-info' />
      <Stack.Screen name='doctor-profile-info' />
    </Stack>
  )
}
