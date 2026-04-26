import { useEffect } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
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
import { useDoctorWalletSummary } from '@/hooks/useDoctorWallet'
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
  const router = useRouter()

  const { data: profile, isLoading: profileLoading } = useDoctorProfile()
  const { data: requestsData } = useDoctorRequestsList()
  const { data: walletSummary } = useDoctorWalletSummary()
  const { mutate: upsertProfile, isPending: isUpserting } = useUpsertDoctorProfile()
  const { mutate: submitRequest, isPending: isSubmitting } = useSubmitDoctorRequest()
  const { mutate: updateOnlineStatus, isPending: isTogglingOnline } = useUpdateDoctorOnlineStatus()

  const latestRequest = requestsData?.data?.[0]
  const registrationStatus = latestRequest?.registrationStatus
  const isApproved = registrationStatus === 'approved'
  const isPending = registrationStatus === 'pending'
  const statusConfig = registrationStatus ? STATUS_CONFIG[registrationStatus] : null

  // Online state — ưu tiên từ profile BE, fallback user.isOnline
  const isOnline = profile?.isOnline ?? user?.isOnline ?? false

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

  // Prefill form khi profile load xong
  useEffect(() => {
    if (!profile) return
    profileForm.reset({
      doctorType: profile.doctorType,
      licenseNumber: profile.licenseNumber,
      licenseExpiryDate: profile.licenseExpiryDate
        ? profile.licenseExpiryDate.slice(0, 10)
        : '',
      specialization: profile.specialization,
      bio: profile.bio ?? '',
      yearsOfExperience: profile.yearsOfExperience?.toString() ?? '',
    })
  }, [profile])

  const handleUpsertProfile = (data: ProfileForm) => {
    upsertProfile(
      {
        ...data,
        yearsOfExperience: data.yearsOfExperience
          ? parseInt(data.yearsOfExperience, 10)
          : undefined,
      },
      {
        onSuccess: () => showToast.success({ message: 'Cập nhật hồ sơ thành công!' }),
        onError: (err: any) =>
          showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' }),
      }
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
          showToast.success({
            message: `Đã chuyển sang ${!isOnline ? 'Online 🟢' : 'Offline 🔴'}`,
          }),
        onError: (err: any) =>
          showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' }),
      }
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Hồ sơ Bác sĩ</Text>
            <Text style={styles.subtitle}>{user?.email ?? ''}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? 'D'}
            </Text>
          </View>
        </View>

        {/* ── Online Status Card ── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Trạng thái nhận sự cố</Text>
              <Text style={styles.cardSub}>
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
          {isTogglingOnline && (
            <ActivityIndicator size='small' color='#059669' style={{ alignSelf: 'flex-end' }} />
          )}
        </View>

        {/* ── Wallet Card ── */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => router.push('/(app)/wallet')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>💰 Ví của tôi</Text>
            <Text style={styles.walletBalance}>
              {(walletSummary?.balance ?? 0).toLocaleString('vi-VN')} ₫
            </Text>
          </View>
          <Text style={styles.walletArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Registration Status ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trạng thái đăng ký</Text>
          <View style={styles.cardRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig?.bg ?? '#F3F4F6' },
              ]}
            >
              <Text style={[styles.statusText, { color: statusConfig?.color ?? '#6B7280' }]}>
                {statusConfig?.label ?? 'Chưa gửi yêu cầu'}
              </Text>
            </View>
            {latestRequest?.reason ? (
              <Text style={styles.reasonText}>Lý do: {latestRequest.reason}</Text>
            ) : null}
          </View>

          {/* Bước hướng dẫn theo trạng thái */}
          {!registrationStatus && (
            <View style={styles.stepHint}>
              <Text style={styles.stepHintText}>
                💡 Điền thông tin hồ sơ bên dưới rồi gửi yêu cầu đăng ký để được admin phê duyệt.
              </Text>
            </View>
          )}
          {isPending && (
            <View style={[styles.stepHint, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.stepHintText, { color: '#92400E' }]}>
                ⏳ Yêu cầu đang chờ admin xét duyệt. Bạn sẽ nhận email khi có kết quả.
              </Text>
            </View>
          )}
          {isApproved && (
            <View style={[styles.stepHint, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.stepHintText, { color: '#065F46' }]}>
                ✅ Đã phê duyệt! Bật Online ở trên để bắt đầu nhận sự cố.
              </Text>
            </View>
          )}
          {registrationStatus === 'rejected' && (
            <View style={[styles.stepHint, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.stepHintText, { color: '#991B1B' }]}>
                ❌ Yêu cầu bị từ chối. Cập nhật hồ sơ và gửi lại yêu cầu mới.
              </Text>
            </View>
          )}
        </View>

        {/* ── Profile Form ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyên môn</Text>
          {profileLoading ? (
            <ActivityIndicator color='#2463EB' style={{ marginVertical: 16 }} />
          ) : (
            <>
              <FormSelectField
                control={profileForm.control}
                name='doctorType'
                label='Loại bác sĩ'
                options={DOCTOR_TYPES}
                labelExtractor={(o) => o.label}
                valueExtractor={(o) => o.value}
              />
              <FormTextField
                control={profileForm.control}
                name='licenseNumber'
                label='Số giấy phép hành nghề'
              />
              <FormTextField
                control={profileForm.control}
                name='licenseExpiryDate'
                label='Ngày hết hạn'
                placeholder='2026-12-31'
              />
              <FormTextField
                control={profileForm.control}
                name='specialization'
                label='Chuyên ngành'
              />
              <FormTextField
                control={profileForm.control}
                name='yearsOfExperience'
                label='Năm kinh nghiệm'
                keyboardType='number-pad'
              />
              <FormTextField
                control={profileForm.control}
                name='bio'
                label='Tiểu sử (tùy chọn)'
                multiline
              />
              <PrimaryButton
                title='Lưu hồ sơ'
                loading={isUpserting}
                onPress={profileForm.handleSubmit(handleUpsertProfile)}
              />
            </>
          )}
        </View>

        {/* ── Request Form — chỉ show nếu chưa pending/approved ── */}
        {!isPending && !isApproved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gửi yêu cầu đăng ký</Text>
            <Text style={styles.sectionSub}>
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

        {/* ── Logout ── */}
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
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2463EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  walletCard: {
    backgroundColor: '#2463EB',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabel: { color: '#DBEAFE', fontSize: 13, fontFamily: 'Inter_500Medium' },
  walletBalance: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  walletArrow: { color: '#fff', fontSize: 28, fontFamily: 'Inter_400Regular' },
  cardTitle: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  cardSub: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  reasonText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular', flex: 1 },
  stepHint: {
    backgroundColor: '#F0F6FF',
    borderRadius: 8,
    padding: 12,
  },
  stepHintText: { fontSize: 13, color: '#1E40AF', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  sectionSub: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  logoutBtn: { borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
})
