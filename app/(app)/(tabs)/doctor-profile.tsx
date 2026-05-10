import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useDoctorProfile, useDoctorRequestsList, useUpdateDoctorOnlineStatus } from '@/hooks/useDoctor'


export default function DoctorProfileScreen() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const { data: profile } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()
  const { mutate: updateOnlineStatus, isPending: isTogglingOnline } = useUpdateDoctorOnlineStatus()

  const registrationStatus = requestsData?.data?.[0]?.registrationStatus
  const isApproved = registrationStatus === 'approved'
  const isOnline = profile?.isOnline ?? user?.isOnline ?? false

  const handleToggleOnline = () => {
    if (!isApproved) {
      showToast.error({ message: 'Cần được phê duyệt trước khi bật online' })
      return
    }
    updateOnlineStatus(
      { isOnline: !isOnline },
      {
        onSuccess: () =>
          showToast.success({ message: `Đã chuyển sang ${!isOnline ? 'Online' : 'Offline'}` }),
        onError: (err: any) =>
          showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' }),
      },
    )
  }

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => { try { await logout() } catch {} } },
    ])
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() ?? 'D'}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName || '—'}</Text>
          <Text style={styles.sub}>Bác sĩ</Text>
          <Text style={styles.sub}>{user?.email ?? ''}</Text>
        </View>

<View style={styles.menuContainer}>
          <View style={styles.menuCard}>
            <View style={styles.menuLeft}>
              <MaterialIcons
                name={isOnline ? 'wifi' : 'wifi-off'}
                size={24}
                color={isOnline ? '#059669' : '#4B5563'}
              />
              <View>
                <Text style={styles.menuLabel}>Nhận sự cố</Text>
                <Text style={styles.menuSub}>{isApproved ? (isOnline ? 'Đang bật' : 'Đang tắt') : 'Cần phê duyệt'}</Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={!isApproved || isTogglingOnline}
              trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
              thumbColor={isOnline ? '#059669' : '#9CA3AF'}
            />
          </View>

          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/doctor-profile-info')}
          >
            <View style={styles.menuLeft}>
              <MaterialIcons name='manage-accounts' size={24} color='#4B5563' />
              <Text style={styles.menuLabel}>Quản lý hồ sơ</Text>
            </View>
            <MaterialIcons name='keyboard-arrow-right' size={24} color='#9CA3AF' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} activeOpacity={0.7} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <MaterialIcons name='logout' size={24} color='#EF4444' />
              <Text style={styles.menuLabelDanger}>Đăng xuất</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingBottom: 40 },

  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#2463EB',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2463EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 48, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 24, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', marginBottom: 2 },

  menuContainer: { paddingHorizontal: 16, gap: 12 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: '#111827', fontFamily: 'Inter_500Medium' },
  menuSub: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 1 },
  menuLabelDanger: { fontSize: 15, color: '#EF4444', fontFamily: 'Inter_500Medium' },

})
