import { useEffect } from 'react'
import { View, ScrollView, StyleSheet, Switch, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Text, PrimaryButton, SecondaryButton } from '@/components/ui'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { FormSelectField } from '@/components/react-hook-form/FormSelectField'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  useDoctorProfile,
  useUpsertDoctorProfile,
  useSubmitDoctorRequest,
  useDoctorRequestsList,
  useUpdateDoctorOnlineStatus,
} from '@/hooks/useDoctor'
import type { DoctorType } from '@/types/doctor'

const DOCTOR_TYPES: { label: string; value: DoctorType }[] = [
  { label: 'Bác sĩ nội bộ', value: 'internal' },
  { label: 'Bác sĩ hợp tác', value: 'partner' },
  { label: 'Bác sĩ điều phối', value: 'coordinator' },
]

const profileSchema = z.object({
  doctorType: z.enum(['internal', 'partner', 'coordinator']),
  licenseNumber: z.string().min(1, 'Số giấy phép bắt buộc'),
  licenseExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng YYYY-MM-DD'),
  specialization: z.string().min(1, 'Chuyên ngành bắt buộc'),
  bio: z.string().optional(),
  yearsOfExperience: z.string().optional(),
})

const requestSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bắt buộc'),
  description: z.string().min(10, 'Mô tả ít nhất 10 ký tự'),
})

type ProfileForm = z.infer<typeof profileSchema>
type RequestForm = z.infer<typeof requestSchema>

const STATUS_CONFIG = {
  approved: { label: 'Đã phê duyệt', bg: '#D1FAE5', color: '#065F46' },
  pending: { label: 'Chờ phê duyệt', bg: '#FEF3C7', color: '#92400E' },
  rejected: { label: 'Từ chối', bg: '#FEE2E2', color: '#991B1B' },
  suspended: { label: 'Tạm khóa', bg: '#F3F4F6', color: '#6B7280' },
}

export default function DoctorProfileScreen() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()

  const { data: profile, isLoading: profileLoading } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()
  const { mutate: upsertProfile, isPending: isUpserting } = useUpsertDoctorProfile()
  const { mutate: submitRequest, isPending: isSubmitting } = useSubmitDoctorRequest()
  const { mutate: updateOnlineStatus, isPending: isTogglingOnline } = useUpdateDoctorOnlineStatus()

  const latestRequest = requestsData?.data?.[0]
  const registrationStatus = latestRequest?.registrationStatus
  const isApproved = registrationStatus === 'approved'
  const isPending = registrationStatus === 'pending'
  const statusConfig = registrationStatus ? STATUS_CONFIG[registrationStatus] : null

  const isOnline = profile?.isOnline ?? user?.isOnline ?? false
  const hasProfile = !!profile?.licenseNumber

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      doctorType: 'internal',
      licenseNumber: '',
      licenseExpiryDate: '',
      specialization: '',
      bio: '',
      yearsOfExperience: '',
    },
  })

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { title: '', description: '' },
  })

  useEffect(() => {
    if (!profile) return
    profileForm.reset({
      doctorType: profile.doctorType,
      licenseNumber: profile.licenseNumber,
      licenseExpiryDate: profile.licenseExpiryDate ? profile.licenseExpiryDate.slice(0, 10) : '',
      specialization: profile.specialization,
      bio: profile.bio ?? '',
      yearsOfExperience: profile.yearsOfExperience?.toString() ?? '',
    })
  }, [profile])

  const handleUpsertProfile = (data: ProfileForm) => {
    upsertProfile(
      {
        ...data,
        yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience, 10) : undefined,
      },
      {
        onSuccess: () => showToast.success({ message: 'Cập nhật hồ sơ thành công!' }),
        onError: (err: any) =>
          showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' }),
      },
    )
  }

  const handleSubmitRequest = (data: RequestForm) => {
    submitRequest(data, {
      onSuccess: () => {
        requestForm.reset()
        showToast.success({ message: 'Gửi yêu cầu thành công! Chờ admin phê duyệt.' })
      },
      onError: (err: any) =>
        showToast.error({ message: err?.response?.data?.message ?? 'Gửi yêu cầu thất bại' }),
    })
  }

  const handleToggleOnline = () => {
    if (!isApproved) {
      showToast.error({ message: 'Chỉ có thể bật online sau khi được phê duyệt' })
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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Hồ sơ Bác sĩ</Text>
          <Text style={styles.headerSub}>{user?.email ?? ''}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() ?? 'D'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Online Status */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.sectionTitle}>Trạng thái nhận sự cố</Text>
              <Text style={styles.helperText}>
                {isApproved
                  ? isOnline
                    ? 'Đang nhận sự cố từ farmer'
                    : 'Tắt — không nhận sự cố mới'
                  : 'Cần phê duyệt trước khi bật'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={!isApproved || isTogglingOnline}
              trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
              thumbColor={isOnline ? '#059669' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Registration Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đăng ký</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig?.bg ?? '#F3F4F6' }]}>
            <Text style={[styles.statusText, { color: statusConfig?.color ?? '#6B7280' }]}>
              {statusConfig?.label ?? 'Chưa gửi yêu cầu'}
            </Text>
          </View>
          {latestRequest?.reason ? (
            <Text style={styles.reasonText}>Lý do: {latestRequest.reason}</Text>
          ) : null}
        </View>

        {/* Thông tin chuyên môn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyên môn</Text>

          {profileLoading ? (
            <ActivityIndicator color='#2463EB' style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.formFields}>
              <FormSelectField
                control={profileForm.control}
                name='doctorType'
                label='Loại bác sĩ'
                options={DOCTOR_TYPES}
                labelExtractor={(o) => o.label}
                valueExtractor={(o) => o.value}
                readOnly={hasProfile}
                showError={false}
              />
              <FormTextField
                control={profileForm.control}
                name='licenseNumber'
                label='Số giấy phép hành nghề'
                readOnly={hasProfile}
                showError={false}
              />
              <FormTextField
                control={profileForm.control}
                name='licenseExpiryDate'
                label='Ngày hết hạn'
                placeholder='2026-12-31'
                readOnly={hasProfile}
                showError={false}
              />
              <FormTextField
                control={profileForm.control}
                name='specialization'
                label='Chuyên ngành'
                readOnly={hasProfile}
                showError={false}
              />
              <FormTextField
                control={profileForm.control}
                name='yearsOfExperience'
                label='Năm kinh nghiệm'
                keyboardType='number-pad'
                readOnly={hasProfile}
                showError={false}
              />
              <FormTextField
                control={profileForm.control}
                name='bio'
                label='Tiểu sử (tùy chọn)'
                showError={false}
              />
              <PrimaryButton
                title='Lưu hồ sơ'
                loading={isUpserting}
                onPress={profileForm.handleSubmit(handleUpsertProfile)}
              />
            </View>
          )}
        </View>

        {/* Registration Form */}
        {!isPending && !isApproved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gửi yêu cầu đăng ký</Text>
            <Text style={styles.helperText}>
              Sau khi lưu hồ sơ, gửi yêu cầu để admin xem xét và phê duyệt tài khoản.
            </Text>
            <View style={styles.formFields}>
              <FormTextField
                control={requestForm.control}
                name='title'
                label='Tiêu đề yêu cầu'
                placeholder='VD: Đăng ký tư vấn nông nghiệp'
              />
              <FormTextField
                control={requestForm.control}
                name='description'
                label='Mô tả kinh nghiệm & mục đích'
              />
              <PrimaryButton
                title='Gửi yêu cầu đăng ký'
                loading={isSubmitting}
                onPress={requestForm.handleSubmit(handleSubmitRequest)}
              />
            </View>
          </View>
        )}

        <SecondaryButton
          title='Đăng xuất'
          onPress={async () => {
            try { await logout() } catch { /* ignore */ }
          }}
          style={styles.logoutBtn}
          textStyle={{ color: '#EF4444' }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 24, lineHeight: 32, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  headerSub: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2463EB', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, color: '#fff', fontFamily: 'Inter_600SemiBold' },

  scrollContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24,
    color: '#111827', fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  helperText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 18 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex1: { flex: 1 },

  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  reasonText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },

  formFields: { gap: 8, marginTop: 4 },

  logoutBtn: {
    borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5',
    marginTop: 8,
  },
})
