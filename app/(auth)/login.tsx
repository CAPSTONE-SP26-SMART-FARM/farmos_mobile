import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, Text } from '@/components/ui'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore()
  const { showToast } = useToast()

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data)
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Đăng nhập thất bại' })
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại!</Text>
        </View>

        <View style={styles.form}>
          <FormTextField control={control} name='email' label='Email' keyboardType='email-address' autoCapitalize='none' autoComplete='email' />
          <FormTextField control={control} name='password' label='Mật khẩu' secureTextEntry showClear={false} />
          <Link href='/(auth)/forgot-password' style={styles.forgotLink}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </Link>
          <PrimaryButton title='Đăng nhập' loading={isLoading} onPress={handleSubmit(onSubmit)} style={styles.button} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <Link href='/(auth)/register'><Text style={styles.footerLink}>Đăng ký</Text></Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  header: { marginBottom: 32, gap: 4 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280' },
  form: { gap: 16 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 14, color: '#2463EB' },
  button: { marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
})
