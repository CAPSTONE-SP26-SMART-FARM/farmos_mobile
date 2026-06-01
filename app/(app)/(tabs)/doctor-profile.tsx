import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, AvatarPicker } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useDoctorProfile, useDoctorRequestsList, useUpdateDoctorOnlineStatus } from '@/hooks/useDoctor'
import { getDefaultAvatar } from '@/constants/user'


export default function DoctorProfileScreen() {
  const { user, logout, updateProfile } = useAuth()
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

  const handleAvatarChange = async (avatarUrl: string | null) => {
    await updateProfile({
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? null,
      avatarUrl,
    })
    showToast.success({ message: avatarUrl ? 'Cập nhật ảnh đại diện thành công!' : 'Đã xoá ảnh đại diện' })
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
          <View style={styles.avatarWrapper}>
            <AvatarPicker
              uri={user?.avatarUrl ?? null}
              name={user?.fullName}
              size={100}
              fallbackSource={getDefaultAvatar(user?.role)}
              onUploaded={(url) => handleAvatarChange(url)}
              onRemoved={() => handleAvatarChange(null)}
            />
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
  avatarWrapper: {
    marginBottom: 16,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
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
