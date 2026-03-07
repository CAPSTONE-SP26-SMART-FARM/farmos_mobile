import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Link } from 'expo-router'
import { Controller } from 'react-hook-form'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input, Text } from '@/components/ui'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const { login, isLoading } = useAuth()
  const { control, handleSubmit, formState: { errors } } = useForm(loginSchema)

  const onSubmit = async (data: LoginForm) => {
    await login(data)
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
          <Text variant="h1">Đăng nhập</Text>
          <Text variant="body" className="text-gray-500 mt-1">Chào mừng trở lại!</Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                secureTextEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            title="Đăng nhập"
            fullWidth
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />
        </View>

        <View className="flex-row justify-center mt-6">
          <Text variant="body" className="text-gray-500">Chưa có tài khoản? </Text>
          <Link href="/(auth)/register">
            <Text variant="body" className="text-primary-600 font-semibold">Đăng ký</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
