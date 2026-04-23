import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Text } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useDoctorProfile, useDoctorRequestsList } from '@/hooks/useDoctor'
import { icons } from '@/constants/icon'

const NotiIcon = icons.notiBgSvg

function DoctorHome() {
  const { user } = useAuth()
  const { data: profile } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()

  const latestRequest = requestsData?.data?.[0]
  const isApproved = latestRequest?.registrationStatus === 'Approved'
  const isOnline = profile?.isOnline ?? user?.isOnline ?? false

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Status banner */}
      {isApproved ? (
        <View style={[styles.banner, isOnline ? styles.bannerOnline : styles.bannerOffline]}>
          <Text style={styles.bannerTitle}>{isOnline ? '🟢 Đang Online' : '🔴 Offline'}</Text>
          <Text style={styles.bannerSub}>
            {isOnline
              ? 'Bạn có thể nhận sự cố từ farmer'
              : 'Sang tab Hồ sơ để bật Online'}
          </Text>
        </View>
      ) : (
        <View style={[styles.banner, styles.bannerPending]}>
          <Text style={styles.bannerTitle}>
            {latestRequest?.registrationStatus === 'Pending'
              ? '⏳ Đang chờ phê duyệt'
              : '⚠️ Chưa có hồ sơ'}
          </Text>
          <Text style={styles.bannerSub}>
            {latestRequest?.registrationStatus === 'Pending'
              ? 'Admin đang xét duyệt tài khoản của bạn'
              : 'Vào Hồ sơ để hoàn tất đăng ký'}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(app)/(tabs)/incidents')}
        >
          <Text style={styles.actionText}>🚨 Sự cố được phân công</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(app)/(tabs)/profile')}
        >
          <Text style={styles.actionText}>👨‍⚕️ Hồ sơ & trạng thái</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function FarmerHome() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(app)/(tabs)/farm')}
        >
          <Text style={styles.actionText}>🌱 Trang trại & cảm biến</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(app)/incident/create')}
        >
          <Text style={styles.actionText}>➕ Tạo báo cáo sự cố</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(app)/(tabs)/incidents')}
        >
          <Text style={styles.actionText}>📋 Danh sách sự cố</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(app)/(tabs)/alerts')}
        >
          <Text style={styles.actionText}>🔔 Cảnh báo IoT</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default function HomeScreen() {
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'

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

      {isDoctor ? <DoctorHome /> : <FarmerHome />}
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },
  banner: {
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  bannerOnline: { backgroundColor: '#D1FAE5' },
  bannerOffline: { backgroundColor: '#FEE2E2' },
  bannerPending: { backgroundColor: '#FEF3C7' },
  bannerTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  bannerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#6B7280' },
  sectionTitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
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
