import { Stack } from 'expo-router'

export default function IncidentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='create' />
      <Stack.Screen name='[id]/index' />
      <Stack.Screen name='[id]/chat' />
    </Stack>
  )
}
