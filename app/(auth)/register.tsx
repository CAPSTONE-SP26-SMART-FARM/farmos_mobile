import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Link } from 'expo-router'
import { Controller } from 'react-hook-form'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input, Text } from '@/components/ui'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuth()
  const { control, handleSubmit, formState: { errors } } = useForm(registerSchema)

  const onSubmit = async ({ name, email, password }: RegisterForm) => {
    await registerUser({ name, email, password })
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text variant="h1">Đăng ký</Text>
          <Text variant="body" className="text-gray-500 mt-1">Tạo tài khoản mới</Text>
        </View>

        <View className="gap-4">
          {(['name', 'email', 'password', 'confirmPassword'] as const).map(field => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={
                    { name: 'Họ tên', email: 'Email', password: 'Mật khẩu', confirmPassword: 'Xác nhận mật khẩu' }[field]
                  }
                  secureTextEntry={field === 'password' || field === 'confirmPassword'}
                  keyboardType={field === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={field === 'email' ? 'none' : 'words'}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors[field]?.message}
                />
              )}
            />
          ))}

          <Button
            title="Đăng ký"
            fullWidth
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />
        </View>

        <View className="flex-row justify-center mt-6">
          <Text variant="body" className="text-gray-500">Đã có tài khoản? </Text>
          <Link href="/(auth)/login">
            <Text variant="body" className="text-primary-600 font-semibold">Đăng nhập</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
