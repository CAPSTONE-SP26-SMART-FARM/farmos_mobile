import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-6 gap-4">
        <Text variant="h2">Hồ sơ</Text>

        <View className="bg-white rounded-xl p-4 gap-2">
          <Text variant="label">Họ tên</Text>
          <Text variant="body">{user?.name}</Text>
          <Text variant="label" className="mt-2">Email</Text>
          <Text variant="body">{user?.email}</Text>
        </View>

        <Button
          title="Đăng xuất"
          variant="destructive"
          fullWidth
          loading={isLoading}
          onPress={logout}
        />
      </View>
    </SafeAreaView>
  )
}
