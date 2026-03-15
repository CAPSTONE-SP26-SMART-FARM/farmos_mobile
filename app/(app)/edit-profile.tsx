import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, Text } from '@/components/ui'

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
})
type EditForm = z.infer<typeof schema>

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useAuth()
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
      await updateProfile({
        fullName: data.fullName,
        phone: data.phone || null,
      })
      showToast.success({ message: 'Cập nhật hồ sơ thành công!' })
      router.back()
    } catch (err: any) {
      showToast.error({
        message: err?.response?.data?.message ?? 'Cập nhật thất bại, vui lòng thử lại',
      })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name='arrow-back' size={22} color='#111827' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {/* Email — read-only, không cho sửa */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email}</Text>
          </View>

          <View style={styles.form}>
            <FormTextField
              control={control}
              name='fullName'
              label='Họ và tên'
              autoCapitalize='words'
            />
            <FormTextField
              control={control}
              name='phone'
              label='Số điện thoại (tuỳ chọn)'
              keyboardType='phone-pad'
            />
          </View>

          <PrimaryButton
            title='Lưu thay đổi'
            loading={isLoading}
            disabled={!isDirty}
            onPress={handleSubmit(onSubmit)}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold',
  },
  spacer: { width: 36 },
  scroll: { padding: 20, gap: 16 },
  readOnlyField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  readOnlyLabel: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  readOnlyValue: { fontSize: 15, color: '#4B5563', fontFamily: 'Inter_500Medium' },
  form: { gap: 16 },
  saveBtn: { marginTop: 8 },
})
