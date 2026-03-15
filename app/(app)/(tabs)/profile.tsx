import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Text, PrimaryButton } from '@/components/ui'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
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

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
})
type EditForm = z.infer<typeof schema>

export default function ProfileScreen() {
  const { user, updateProfile, logout, isLoading } = useAuth()
  const { showToast } = useToast()

  const { control, handleSubmit, formState: { isDirty } } = useForm<EditForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const onSubmit = async (data: EditForm) => {
    try {
      await updateProfile({ fullName: data.fullName, phone: data.phone || null })
      showToast.success({ message: 'Cập nhật hồ sơ thành công!' })
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      showToast.error({ message: 'Đăng xuất thất bại' })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Title */}
        <Text style={styles.title}>Hồ sơ</Text>

        {/* Avatar */}
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

        {/* Fields */}
        <View style={styles.fieldsSection}>
          {/* Email — không cho sửa */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email ?? '—'}</Text>
          </View>

          {/* Vai trò — không cho sửa */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Vai trò</Text>
            <Text style={styles.readOnlyValue}>
              {ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'}
            </Text>
          </View>

          {/* Họ tên — cho sửa */}
          <FormTextField
            control={control}
            name='fullName'
            label='Họ và tên'
            autoCapitalize='words'
          />

          {/* Số điện thoại — cho sửa */}
          <FormTextField
            control={control}
            name='phone'
            label='Số điện thoại'
            keyboardType='phone-pad'
          />
        </View>

        {/* Save */}
        <PrimaryButton
          title='Lưu thay đổi'
          loading={isLoading}
          disabled={!isDirty}
          onPress={handleSubmit(onSubmit)}
        />

        {/* Logout */}
        <PrimaryButton
          title='Đăng xuất'
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 24,
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2463EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  fullName: {
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 13,
    color: '#2463EB',
    fontFamily: 'Inter_500Medium',
  },
  fieldsSection: { gap: 12 },
  readOnlyField: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 2,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  readOnlyValue: {
    fontSize: 15,
    color: '#4B5563',
    fontFamily: 'Inter_500Medium',
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
  },
})
