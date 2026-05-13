import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Link, router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api/auth'
import { useToast } from '@/hooks/useToast'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, SecondaryButton, Text } from '@/components/ui'
import { getErrorMessage } from '@/utils/error'

// ── Schemas ──
const emailSchema = z.object({ email: z.string().email('Email không hợp lệ') })
const otpSchema = z.object({ code: z.string().length(6, 'Mã OTP gồm 6 chữ số') })
const accountSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự'),
    phone: z.string().max(20).optional(),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type EmailForm = z.infer<typeof emailSchema>
type OtpForm = z.infer<typeof otpSchema>
type AccountForm = z.infer<typeof accountSchema>

type Step = 1 | 2 | 3

// ── Header ──
function StepHeader({ step, email, onBack }: { step: Step; email: string; onBack: () => void }) {
  const subtitles: Record<Step, string> = {
    1: 'Nhập email để nhận mã xác thực',
    2: `Nhập mã OTP đã gửi đến ${email}`,
    3: 'Hoàn tất thông tin tài khoản',
  }
  return (
    <View style={styles.header}>
      {step > 1 && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name='arrow-back' size={22} color='#111827' />
        </TouchableOpacity>
      )}
      <Text style={styles.brand}>FarmOS</Text>
      <Text style={styles.title}>Đăng ký</Text>
      <Text style={styles.subtitle}>{subtitles[step]}</Text>
      <View style={styles.stepRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.stepDot, s <= step && styles.stepDotActive]} />
        ))}
      </View>
    </View>
  )
}

// ── Screen ──
export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuthStore()
  const { showToast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  })
  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: '', phone: '', password: '', confirmPassword: '' },
  })

  const handleSendOtp = async (data: EmailForm) => {
    setIsSendingOtp(true)
    try {
      await authApi.sendOtp({ email: data.email, type: 'REGISTER' })
      setEmail(data.email)
      setStep(2)
      showToast.success({ message: 'Mã OTP đã được gửi đến email của bạn' })
    } catch (err) {
      showToast.error({ message: getErrorMessage(err, 'Gửi OTP thất bại') })
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (data: OtpForm) => {
    setIsVerifyingOtp(true)
    try {
      await authApi.verifyOtp({ email, type: 'REGISTER', code: data.code })
      setOtpCode(data.code)
      setStep(3)
    } catch (err) {
      otpForm.setError('code', { message: getErrorMessage(err, 'Mã OTP không hợp lệ') })
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleRegister = async (data: AccountForm) => {
    try {
      await registerUser({
        email,
        code: otpCode,
        fullName: data.fullName,
        phone: data.phone || null,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: 'doctor',
      })
      showToast.success({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' })
      router.replace('/(auth)/login')
    } catch (err) {
      showToast.error({ message: getErrorMessage(err, 'Đăng ký thất bại') })
    }
  }

  return (
    <LinearGradient colors={['#E0F2FF', '#FFFFFF']} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
        <StepHeader step={step} email={email} onBack={() => setStep((step - 1) as Step)} />

        {step === 1 && (
          <View style={styles.form}>
            <FormTextField
              control={emailForm.control}
              name='email'
              label='Email'
              keyboardType='email-address'
              autoCapitalize='none'
              autoComplete='email'
            />
            <PrimaryButton
              title='Gửi mã OTP'
              loading={isSendingOtp}
              onPress={emailForm.handleSubmit(handleSendOtp)}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <FormTextField
              control={otpForm.control}
              name='code'
              label='Mã OTP (6 chữ số)'
              keyboardType='number-pad'
              maxLength={6}
              autoFocus
            />
            <PrimaryButton
              title='Xác nhận OTP'
              loading={isVerifyingOtp}
              onPress={otpForm.handleSubmit(handleVerifyOtp)}
            />
            <SecondaryButton
              title='Gửi lại OTP'
              loading={isSendingOtp}
              onPress={emailForm.handleSubmit(handleSendOtp)}
              size='small'
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.form}>
            <FormTextField control={accountForm.control} name='fullName' label='Họ và tên' autoCapitalize='words' />
            <FormTextField control={accountForm.control} name='phone' label='Số điện thoại (tuỳ chọn)' keyboardType='phone-pad' />
            <FormTextField control={accountForm.control} name='password' label='Mật khẩu' secureTextEntry showClear={false} />
            <FormTextField control={accountForm.control} name='confirmPassword' label='Xác nhận mật khẩu' secureTextEntry showClear={false} />
            <PrimaryButton
              title='Tạo tài khoản'
              loading={isLoading}
              onPress={accountForm.handleSubmit(handleRegister)}
            />
          </View>
        )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <Link href='/(auth)/login'>
              <Text style={styles.footerLink}>Đăng nhập</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  header: { alignItems: 'center', marginBottom: 24, gap: 8 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 4 },
  brand: { fontSize: 32, lineHeight: 40, fontFamily: 'Inter_700Bold', color: '#2463EB', textAlign: 'center' },
  title: { fontSize: 24, lineHeight: 32, fontFamily: 'Inter_700Bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', textAlign: 'center' },
  stepRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: '#2463EB' },
  form: { gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
})
