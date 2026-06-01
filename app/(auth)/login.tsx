import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, Text } from '@/components/ui'
import TickSigninSvg from '@/assets/icons/icon-tick-signin.svg'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
})
type LoginForm = z.infer<typeof loginSchema>

const FEATURES = [
  'Theo dõi sự cố, cảnh báo và trạng thái xử lý theo thời gian thực',
  'Quản lý công việc và vận hành trang trại hằng ngày ngay trên điện thoại',
]

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
    <LinearGradient colors={['#DCFCE7', '#FFFFFF']} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>FarmOS</Text>
            <Text style={styles.title}>Quản lý nông trại dễ dàng</Text>
            <Text style={styles.subtitle}>Theo dõi công việc, cảnh báo và vận hành hằng ngày ngay trên điện thoại.</Text>
          </View>

          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureItem}>
                <TickSigninSvg width={20} height={20} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
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
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 36 },
  header: { alignItems: 'center', marginBottom: 24, gap: 8 },
  brand: { fontSize: 32, lineHeight: 40, fontFamily: 'Inter_700Bold', color: '#15803D', textAlign: 'center' },
  title: { fontSize: 24, lineHeight: 32, fontFamily: 'Inter_700Bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', textAlign: 'center' },
  featureList: { gap: 10, marginBottom: 28 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#4B5563' },
  form: { gap: 16 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 14, color: '#15803D' },
  button: { marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: '#15803D', fontFamily: 'Inter_600SemiBold' },
})
