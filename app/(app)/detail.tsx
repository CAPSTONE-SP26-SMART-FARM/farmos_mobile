import { View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, Button } from '@/components/ui'

export default function DetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <Text variant="body">←</Text>
        </TouchableOpacity>
        <Text variant="h3">Chi tiết</Text>
      </View>

      <View className="flex-1 px-4 pt-6 gap-4">
        <View className="bg-gray-100 rounded-2xl h-48 items-center justify-center">
          <Text variant="caption" className="text-gray-400">Image placeholder</Text>
        </View>

        <View>
          <View className="flex-row items-center gap-2 mb-1">
            <Text variant="caption" className="text-gray-400">ID: {id}</Text>
          </View>
          <Text variant="h2">{title}</Text>
          <Text variant="body" className="text-gray-500 mt-2">
            Đây là màn hình detail — được navigate từ tab Khám phá qua Expo Router stack navigation.
            Params truyền qua URL query string.
          </Text>
        </View>

        <View className="flex-row gap-3 mt-auto mb-6">
          <Button title="Thêm vào giỏ" variant="outline" className="flex-1" onPress={() => {}} />
          <Button title="Mua ngay" variant="primary" className="flex-1" onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  )
}
