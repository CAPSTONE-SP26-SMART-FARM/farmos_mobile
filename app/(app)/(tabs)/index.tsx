import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Text } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { icons } from '@/constants/icon'

const NotiIcon = icons.notiBgSvg

export default function HomeScreen() {
  const { user } = useAuth()

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetSub}>Chào mừng trở lại,</Text>
          <Text style={styles.greetName}>{user?.fullName ?? 'FarmOS'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notiBtnWrap}
          onPress={() => router.push('/(app)/(tabs)/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NotiIcon width={36} height={36} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { gap: 2 },
  greetSub: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  greetName: { fontSize: 22, color: '#111827', fontFamily: 'Inter_700Bold' },
  notiBtnWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 24 },
  sectionTitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 8, fontFamily: 'Inter_500Medium' },
  actions: { gap: 8 },
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
