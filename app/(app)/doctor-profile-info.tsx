import { View, ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { ProfileInfoLayout, s } from '@/components/features/profile/ProfileInfoLayout'
import { useDoctorProfile, useDoctorRequestsList, useDoctorDqs } from '@/hooks/useDoctor'
import { DOCTOR_TYPE_LABEL, REGISTRATION_STATUS_CONFIG } from '@/constants/doctor'
import type { DoctorTier } from '@/types/doctor'

const TIER_CONFIG: Record<DoctorTier, { bg: string; color: string }> = {
  PLATINUM: { bg: '#EDE9FE', color: '#7C3AED' },
  GOLD:     { bg: '#FEF3C7', color: '#D97706' },
  SILVER:   { bg: '#F3F4F6', color: '#6B7280' },
  BRONZE:   { bg: '#FEF9C3', color: '#92400E' },
}

export default function DoctorProfileInfoScreen() {
  const router = useRouter()
  const { data: profile, isLoading: profileLoading } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()
  const { data: dqs } = useDoctorDqs()

  const latestRequest = requestsData?.data?.[0]
  const registrationStatus = latestRequest?.registrationStatus
  const statusConfig = registrationStatus ? REGISTRATION_STATUS_CONFIG[registrationStatus] : null
  const hasProfile = !!profile?.licenseNumber

  const expiryDisplay = profile?.licenseExpiryDate
    ? profile.licenseExpiryDate.slice(0, 10).split('-').reverse().join('/')
    : '—'

  return (
    <ProfileInfoLayout editPath='/(app)/edit-doctor-profile'>
      <Pressable
        style={({ pressed }) => [s.section, pressed && { opacity: 0.7 }]}
        onPress={() => router.push('/(app)/doctor-dqs')}
      >
        <View style={local.sectionHeader}>
          <Text style={s.sectionTitle}>Thứ hạng chất lượng</Text>
          <MaterialIcons name='chevron-right' size={22} color='#9CA3AF' />
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Hạng</Text>
          {dqs?.latest ? (
            <View style={[s.statusBadge, { backgroundColor: TIER_CONFIG[dqs.latest.tier].bg }]}>
              <Text style={[s.statusText, { color: TIER_CONFIG[dqs.latest.tier].color }]}>
                {dqs.latest.tier}
              </Text>
            </View>
          ) : (
            <Text style={[s.infoValue, s.infoValueGray]}>Chưa có dữ liệu</Text>
          )}
        </View>
        {dqs?.latest && (
          <>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Điểm tổng</Text>
              <Text style={s.infoValue}>{dqs.latest.totalScore.toFixed(1)}</Text>
            </View>
          </>
        )}
      </Pressable>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Thông tin chuyên môn</Text>
        {profileLoading ? (
          <ActivityIndicator color='#15803D' style={{ marginVertical: 12 }} />
        ) : hasProfile ? (
          <>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Loại bác sĩ</Text>
              <Text style={s.infoValue}>{DOCTOR_TYPE_LABEL[profile!.doctorType]}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Số giấy phép</Text>
              <Text style={s.infoValue}>{profile?.licenseNumber}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Ngày hết hạn</Text>
              <Text style={s.infoValue}>{expiryDisplay}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Chuyên ngành</Text>
              <Text style={s.infoValue}>{profile?.specialization}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Năm kinh nghiệm</Text>
              <Text style={s.infoValue}>{profile?.yearsOfExperience ?? '—'}</Text>
            </View>
            {!!profile?.bio && (
              <>
                <View style={s.divider} />
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Tiểu sử</Text>
                  <Text style={s.infoValue}>{profile.bio}</Text>
                </View>
              </>
            )}
          </>
        ) : (
          <Text style={s.emptyText}>Chưa có hồ sơ chuyên môn. Nhấn chỉnh sửa để tạo hồ sơ.</Text>
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Trạng thái đăng ký</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Trạng thái</Text>
          <View style={[s.statusBadge, { backgroundColor: statusConfig?.bg ?? '#F3F4F6' }]}>
            <Text style={[s.statusText, { color: statusConfig?.color ?? '#6B7280' }]}>
              {statusConfig?.label ?? 'Chưa gửi yêu cầu'}
            </Text>
          </View>
        </View>
        {latestRequest?.reason ? (
          <>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Lý do</Text>
              <Text style={[s.infoValue, { color: '#991B1B' }]}>{latestRequest.reason}</Text>
            </View>
          </>
        ) : null}
      </View>
    </ProfileInfoLayout>
  )
}

const local = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
})
