import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Link, router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api/auth'
import { useToast } from '@/hooks/useToast'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, SecondaryButton, Text } from '@/components/ui'

const step1Schema = z.object({ email: z.string().email('Email không hợp lệ') })
const step2Schema = z.object({ code: z.string().length(6, 'Mã OTP gồm 6 chữ số') })
const step3Schema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự'),
  phone: z.string().max(20).optional(),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  role: z.enum(['owner', 'doctor']),
}).refine((d) => d.password === d.confirmPassword, { message: 'Mật khẩu không khớp', path: ['confirmPassword'] })

type Step1Form = z.infer<typeof step1Schema>
type Step2Form = z.infer<typeof step2Schema>
type Step3Form = z.infer<typeof step3Schema>

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuthStore()
  const { showToast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  const step1Form = useForm<Step1Form>({ resolver: zodResolver(step1Schema), defaultValues: { email: '' } })
  const step2Form = useForm<Step2Form>({ resolver: zodResolver(step2Schema), defaultValues: { code: '' } })
  const step3Form = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: { fullName: '', phone: '', password: '', confirmPassword: '', role: 'owner' },
  })

  const handleSendOtp = async (data: Step1Form) => {
    setIsSendingOtp(true)
    try {
      await authApi.sendOtp({ email: data.email, type: 'REGISTER' })
      setEmail(data.email)
      setStep(2)
      showToast.success({ message: 'Mã OTP đã được gửi đến email của bạn' })
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Gửi OTP thất bại' })
    } finally { setIsSendingOtp(false) }
  }

  const handleVerifyOtp = (data: Step2Form) => { setOtpCode(data.code); setStep(3) }

  const handleRegister = async (data: Step3Form) => {
    try {
      await registerUser({ email, code: otpCode, fullName: data.fullName, phone: data.phone || null, password: data.password, confirmPassword: data.confirmPassword, role: data.role })
      showToast.success({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' })
      router.replace('/(auth)/login')
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Đăng ký thất bại' })
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep((step - 1) as 1 | 2 | 3)} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name='arrow-back' size={22} color='#111827' />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Nhập email để nhận mã xác thực'}
            {step === 2 && `Nhập mã OTP đã gửi đến ${email}`}
            {step === 3 && 'Hoàn tất thông tin tài khoản'}
          </Text>
          <View style={styles.stepRow}>
            {[1, 2, 3].map((s) => <View key={s} style={[styles.stepDot, s <= step && styles.stepDotActive]} />)}
          </View>
        </View>

        {step === 1 && (
          <View style={styles.form}>
            <FormTextField control={step1Form.control} name='email' label='Email' keyboardType='email-address' autoCapitalize='none' autoComplete='email' />
            <PrimaryButton title='Gửi mã OTP' loading={isSendingOtp} onPress={step1Form.handleSubmit(handleSendOtp)} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <FormTextField control={step2Form.control} name='code' label='Mã OTP (6 chữ số)' keyboardType='number-pad' maxLength={6} autoFocus />
            <PrimaryButton title='Xác nhận OTP' onPress={step2Form.handleSubmit(handleVerifyOtp)} />
            <SecondaryButton title='Gửi lại OTP' loading={isSendingOtp} onPress={step1Form.handleSubmit(handleSendOtp)} size='small' />
          </View>
        )}

        {step === 3 && (
          <View style={styles.form}>
            <FormTextField control={step3Form.control} name='fullName' label='Họ và tên' autoCapitalize='words' />
            <FormTextField control={step3Form.control} name='phone' label='Số điện thoại (tuỳ chọn)' keyboardType='phone-pad' />
            <FormTextField control={step3Form.control} name='password' label='Mật khẩu' secureTextEntry showClear={false} />
            <FormTextField control={step3Form.control} name='confirmPassword' label='Xác nhận mật khẩu' secureTextEntry showClear={false} />
            <PrimaryButton title='Tạo tài khoản' loading={isLoading} onPress={step3Form.handleSubmit(handleRegister)} />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <Link href='/(auth)/login'><Text style={styles.footerLink}>Đăng nhập</Text></Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  header: { marginBottom: 32, gap: 8 },
  backBtn: { marginBottom: 4 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280' },
  stepRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: '#2463EB' },
  form: { gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
})
