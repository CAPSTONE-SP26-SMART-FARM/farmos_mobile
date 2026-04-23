import { useRouter } from 'expo-router'
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, EmptyState } from '@/components/ui'
import { useMyAssignments } from '@/hooks/useIncident'

export default function FarmScreen() {
  const router = useRouter()
  const { data: assignments = [], isLoading } = useMyAssignments()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trang trại</Text>
        <Text style={styles.subtitle}>Cảm biến & thiết bị</Text>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color='#2463EB' />
        ) : assignments.length === 0 ? (
          <EmptyState message='Bạn chưa được gán thiết bị nào.' />
        ) : (
          <View style={styles.list}>
            {assignments.map((a) => (
              <TouchableOpacity
                key={a.assignmentId}
                style={styles.card}
                onPress={() => router.push(`/(app)/farm/${a.assignmentId}`)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.device.deviceName}</Text>
                  <Text style={styles.cardSubtitle}>{a.sensors.length} cảm biến</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginBottom: 20 },
  list: { gap: 12 },
  card: {
    padding: 16, backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center',
  },
  cardTitle: { fontSize: 14, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  cardSubtitle: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
