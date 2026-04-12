import { Stack } from 'expo-router'

export default function IncidentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/chat" />
      <Stack.Screen
        name="severity-picker"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1.0],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  )
}
