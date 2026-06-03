import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useUpdateAvatar } from '@/hooks/useUpdateAvatar'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, Text, TextField, TopBar, AvatarPicker } from '@/components/ui'
import { getDefaultAvatar } from '@/constants/user'

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
})
type EditForm = z.infer<typeof schema>

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useAuth()
  const { showToast } = useToast()
  const handleAvatarChange = useUpdateAvatar()

  const { control, handleSubmit } = useForm<EditForm>({
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
      router.back()
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại, vui lòng thử lại' })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title='Chỉnh sửa hồ sơ' />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            <TextField label='Email' value={user?.email ?? ''} readOnly showError={false} />
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
              label='Số điện thoại (tuỳ chọn)'
              keyboardType='phone-pad'
              showError={false}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title='Lưu thay đổi'
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
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
  scrollContent: { padding: 16, gap: 16 },
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
})
