import { useEffect } from 'react'
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Text, TopBar, PrimaryButton, AvatarPicker } from '@/components/ui'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { FormSelectField } from '@/components/react-hook-form/FormSelectField'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useUpdateAvatar } from '@/hooks/useUpdateAvatar'
import { getDefaultAvatar } from '@/constants/user'
import {
  useDoctorProfile,
  useUpsertDoctorProfile,
  useSubmitDoctorRequest,
  useDoctorRequestsList,
} from '@/hooks/useDoctor'
import { DOCTOR_TYPES } from '@/constants/doctor'

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

export default function EditDoctorProfileScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  const handleAvatarChange = useUpdateAvatar()

  const { data: profile, isLoading: profileLoading } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()
  const { mutate: upsertProfile, isPending: isUpserting } = useUpsertDoctorProfile()
  const { mutate: submitRequest, isPending: isSubmitting } = useSubmitDoctorRequest()

  const latestRequest = requestsData?.data?.[0]
  const registrationStatus = latestRequest?.registrationStatus
  const isApproved = registrationStatus === 'approved'
  const isPending = registrationStatus === 'pending'
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
        onSuccess: () => {
          showToast.success({ message: 'Cập nhật hồ sơ thành công!' })
          router.back()
        },
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
        router.back()
      },
      onError: (err: any) =>
        showToast.error({ message: err?.response?.data?.message ?? 'Gửi yêu cầu thất bại' }),
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title='Chỉnh sửa hồ sơ' />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.avatarSection}>
            <AvatarPicker
              uri={user?.avatarUrl ?? null}
              name={user?.fullName}
              fallbackSource={getDefaultAvatar(user?.role)}
              onUploaded={(url) => handleAvatarChange(url)}
              onRemoved={() => handleAvatarChange(null)}
            />
          </View>

          {profileLoading ? (
            <ActivityIndicator color='#15803D' style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin chuyên môn</Text>
                {!hasProfile ? (
                  <>
                    <FormSelectField
                      control={profileForm.control}
                      name='doctorType'
                      label='Loại bác sĩ'
                      options={DOCTOR_TYPES}
                      labelExtractor={(o) => o.label}
                      valueExtractor={(o) => o.value}
                      showError={false}
                    />
                    <FormTextField
                      control={profileForm.control}
                      name='licenseNumber'
                      label='Số giấy phép hành nghề'
                      showError={false}
                    />
                    <FormTextField
                      control={profileForm.control}
                      name='licenseExpiryDate'
                      label='Ngày hết hạn'
                      placeholder='2026-12-31'
                      showError={false}
                    />
                    <FormTextField
                      control={profileForm.control}
                      name='specialization'
                      label='Chuyên ngành'
                      showError={false}
                    />
                    <FormTextField
                      control={profileForm.control}
                      name='yearsOfExperience'
                      label='Năm kinh nghiệm'
                      keyboardType='number-pad'
                      showError={false}
                    />
                  </>
                ) : null}
                <FormTextField
                  control={profileForm.control}
                  name='bio'
                  label='Tiểu sử (tùy chọn)'
                  showError={false}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {!isPending && !isApproved && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Gửi yêu cầu đăng ký</Text>
                  <Text style={styles.helperText}>
                    Sau khi lưu hồ sơ, gửi yêu cầu để admin xem xét và phê duyệt tài khoản.
                  </Text>
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
                    multiline
                    numberOfLines={4}
                  />
                  <PrimaryButton
                    title='Gửi yêu cầu đăng ký'
                    loading={isSubmitting}
                    onPress={requestForm.handleSubmit(handleSubmitRequest)}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title='Lưu hồ sơ'
            loading={isUpserting}
            onPress={profileForm.handleSubmit(handleUpsertProfile)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 16, gap: 12 },
  footer: { padding: 20, backgroundColor: '#FFFFFF' },
  avatarSection: { alignItems: 'center', paddingVertical: 8 },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 16,
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24,
    color: '#111827', fontFamily: 'Inter_600SemiBold',
  },
  helperText: {
    fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular',
    lineHeight: 18, marginTop: -4,
  },
})
