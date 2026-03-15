import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api/auth'
import { useToast } from '@/hooks/useToast'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { PrimaryButton, Text } from '@/components/ui'

const step1Schema = z.object({ email: z.string().email('Email không hợp lệ') })
const step2Schema = z.object({ code: z.string().length(6, 'Mã OTP gồm 6 chữ số') })
const step3Schema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmNewPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
}).refine((d) => d.newPassword === d.confirmNewPassword, { message: 'Mật khẩu không khớp', path: ['confirmNewPassword'] })

type Step1Form = z.infer<typeof step1Schema>
type Step2Form = z.infer<typeof step2Schema>
type Step3Form = z.infer<typeof step3Schema>

export default function ForgotPasswordScreen() {
  const { forgotPassword, isLoading } = useAuthStore()
  const { showToast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  const step1Form = useForm<Step1Form>({ resolver: zodResolver(step1Schema), defaultValues: { email: '' } })
  const step2Form = useForm<Step2Form>({ resolver: zodResolver(step2Schema), defaultValues: { code: '' } })
  const step3Form = useForm<Step3Form>({ resolver: zodResolver(step3Schema), defaultValues: { newPassword: '', confirmNewPassword: '' } })

  const handleSendOtp = async (data: Step1Form) => {
    setIsSendingOtp(true)
    try {
      await authApi.sendOtp({ email: data.email, type: 'FORGOT_PASSWORD' })
      setEmail(data.email)
      setStep(2)
      showToast.success({ message: 'Mã OTP đã được gửi đến email của bạn' })
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Gửi OTP thất bại' })
    } finally { setIsSendingOtp(false) }
  }

  const handleVerifyOtp = (data: Step2Form) => { setOtpCode(data.code); setStep(3) }

  const handleResetPassword = async (data: Step3Form) => {
    try {
      await forgotPassword({ email, code: otpCode, ...data })
      showToast.success({ message: 'Đổi mật khẩu thành công!' })
      router.replace('/(auth)/login')
    } catch (err: any) {
      showToast.error({ message: err?.response?.data?.message ?? 'Đổi mật khẩu thất bại' })
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name='arrow-back' size={22} color='#111827' />
          </TouchableOpacity>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Nhập email để nhận mã xác thực'}
            {step === 2 && `Nhập mã OTP đã gửi đến ${email}`}
            {step === 3 && 'Nhập mật khẩu mới'}
          </Text>
        </View>

        {step === 1 && (
          <View style={styles.form}>
            <FormTextField control={step1Form.control} name='email' label='Email' keyboardType='email-address' autoCapitalize='none' />
            <PrimaryButton title='Gửi mã OTP' loading={isSendingOtp} onPress={step1Form.handleSubmit(handleSendOtp)} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <FormTextField control={step2Form.control} name='code' label='Mã OTP (6 chữ số)' keyboardType='number-pad' maxLength={6} autoFocus />
            <PrimaryButton title='Tiếp tục' onPress={step2Form.handleSubmit(handleVerifyOtp)} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.form}>
            <FormTextField control={step3Form.control} name='newPassword' label='Mật khẩu mới' secureTextEntry showClear={false} />
            <FormTextField control={step3Form.control} name='confirmNewPassword' label='Xác nhận mật khẩu mới' secureTextEntry showClear={false} />
            <PrimaryButton title='Đổi mật khẩu' loading={isLoading} onPress={step3Form.handleSubmit(handleResetPassword)} />
          </View>
        )}
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
  form: { gap: 16 },
})
