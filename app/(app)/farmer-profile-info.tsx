import { View } from 'react-native'
import { Text } from '@/components/ui'
import { ProfileInfoLayout, s } from '@/components/features/profile/ProfileInfoLayout'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABEL } from '@/constants/user'

export default function FarmerProfileInfoScreen() {
  const { user } = useAuth()
  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'

  return (
    <ProfileInfoLayout editPath='/(app)/edit-profile'>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Tài khoản</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Email</Text>
          <Text style={s.infoValue}>{user?.email ?? '—'}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Vai trò</Text>
          <Text style={s.infoValue}>{roleLabel}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Thông tin cá nhân</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Họ và tên</Text>
          <Text style={s.infoValue}>{user?.fullName || '—'}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Số điện thoại</Text>
          <Text style={[s.infoValue, !user?.phone && s.infoValueGray]}>
            {user?.phone || 'Chưa cập nhật'}
          </Text>
        </View>
      </View>
    </ProfileInfoLayout>
  )
}
