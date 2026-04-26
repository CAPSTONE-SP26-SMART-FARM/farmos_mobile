import { View, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Text, TextField, PrimaryButton, SecondaryButton } from '@/components/ui'
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

export default function FarmerProfileScreen() {
  const { user, updateProfile, logout, isLoading } = useAuth()
  const { showToast } = useToast()

  const { control, handleSubmit, formState: { isDirty } } = useForm<EditForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '—'

  const onSubmit = async (data: EditForm) => {
    try {
      await updateProfile({ fullName: data.fullName, phone: data.phone || null })
      showToast.success({ message: 'Cập nhật hồ sơ thành công!' })
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' })
    }
  }

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <Text style={styles.headerSub}>{user?.email ?? ''}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.fields}>
            <TextField label='Email' value={user?.email ?? ''} readOnly showError={false} />
            <TextField label='Vai trò' value={roleLabel} readOnly showError={false} />
            <FormTextField
              control={control}
              name='fullName'
              label='Họ và tên'
              autoCapitalize='words'
              showError={false}
            />
            <FormTextField
              control={control}
              name='phone'
              label='Số điện thoại'
              keyboardType='phone-pad'
              showError={false}
            />
            <PrimaryButton
              title='Lưu thay đổi'
              loading={isLoading}
              disabled={!isDirty}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </View>

        <SecondaryButton
          title='Đăng xuất'
          onPress={handleLogout}
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
  fields: { gap: 8, marginTop: 4 },

  logoutBtn: {
    borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5',
    marginTop: 8,
  },
})
