import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, PrimaryButton } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Chủ trang trại',
  manager: 'Quản lý',
  farmer: 'Nông dân',
  rancher: 'Chăn nuôi',
  doctor: 'Bác sĩ',
  admin: 'Admin',
}

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth()
  const { showToast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      showToast.error({ message: 'Đăng xuất thất bại' })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/edit-profile')}
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name='create-outline' size={22} color='#2463EB' />
          </TouchableOpacity>
        </View>

        {/* Avatar + tên */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.fullName}>{user?.fullName ?? '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Số điện thoại</Text>
            <Text style={[styles.value, !user?.phone && styles.valueEmpty]}>
              {user?.phone ?? 'Chưa cập nhật'}
            </Text>
          </View>
        </View>

        <PrimaryButton
          title='Đăng xuất'
          loading={isLoading}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  editBtn: { padding: 4 },
  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#2463EB', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
  fullName: { fontSize: 18, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  roleBadge: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  roleText: { fontSize: 13, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16 },
  row: { paddingVertical: 14, gap: 4 },
  label: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  value: { fontSize: 15, color: '#111827', fontFamily: 'Inter_500Medium' },
  valueEmpty: { color: '#9CA3AF', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  logoutBtn: { backgroundColor: '#EF4444', marginTop: 8 },
})
