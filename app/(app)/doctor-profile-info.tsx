import { View, ActivityIndicator } from 'react-native'
import { Text } from '@/components/ui'
import { ProfileInfoLayout, s } from '@/components/features/profile/ProfileInfoLayout'
import { useDoctorProfile, useDoctorRequestsList } from '@/hooks/useDoctor'
import { DOCTOR_TYPE_LABEL, REGISTRATION_STATUS_CONFIG } from '@/constants/doctor'

export default function DoctorProfileInfoScreen() {
  const { data: profile, isLoading: profileLoading } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()

  const latestRequest = requestsData?.data?.[0]
  const registrationStatus = latestRequest?.registrationStatus
  const statusConfig = registrationStatus ? REGISTRATION_STATUS_CONFIG[registrationStatus] : null
  const hasProfile = !!profile?.licenseNumber

  const expiryDisplay = profile?.licenseExpiryDate
    ? profile.licenseExpiryDate.slice(0, 10).split('-').reverse().join('/')
    : '—'

  return (
    <ProfileInfoLayout editPath='/(app)/edit-doctor-profile'>
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

      <View style={s.section}>
        <Text style={s.sectionTitle}>Thông tin chuyên môn</Text>
        {profileLoading ? (
          <ActivityIndicator color='#2463EB' style={{ marginVertical: 12 }} />
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
    </ProfileInfoLayout>
  )
}
