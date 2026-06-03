import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, AvatarPicker } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateAvatar } from '@/hooks/useUpdateAvatar'
import { ROLE_LABEL, getDefaultAvatar } from '@/constants/user'

export default function FarmerProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const handleAvatarChange = useUpdateAvatar()
  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'

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
          <Text style={styles.sub}>{roleLabel}</Text>
          <Text style={styles.sub}>{user?.email ?? ''}</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/farmer-profile-info')}
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
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  name: { fontSize: 24, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', marginBottom: 2 },

  menuContainer: { paddingHorizontal: 16, gap: 12 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: '#111827', fontFamily: 'Inter_500Medium' },
  menuLabelDanger: { fontSize: 15, color: '#EF4444', fontFamily: 'Inter_500Medium' },
})
