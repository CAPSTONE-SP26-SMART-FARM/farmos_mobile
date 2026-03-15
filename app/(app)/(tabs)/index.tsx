import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export default function HomeScreen() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text style={styles.greetSub}>Chào mừng trở lại,</Text>
          <Text style={styles.greetName}>{user?.fullName ?? 'FarmOS'}</Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/(tabs)/explore')}>
            <Text style={styles.actionText}>Khám phá</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/(tabs)/profile')}>
            <Text style={styles.actionText}>Hồ sơ</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 24 },
  greeting: { gap: 4 },
  greetSub: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  greetName: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 14, color: '#6B7280', marginBottom: 8, fontFamily: 'Inter_500Medium' },
  actions: { gap: 4 },
  actionRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: { fontSize: 15, color: '#111827', fontFamily: 'Inter_400Regular' },
  arrow: { fontSize: 15, color: '#9CA3AF' },
})
