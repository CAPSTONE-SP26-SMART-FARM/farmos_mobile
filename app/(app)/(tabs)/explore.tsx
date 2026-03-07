import { View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { Text } from '@/components/ui'

const ITEMS = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  title: `Item #${i + 1}`,
  subtitle: `Mô tả ngắn cho item số ${i + 1}`,
  tag: ['Hot', 'New', 'Sale', 'Featured'][i % 4],
}))

export default function ExploreScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-6 pb-3">
        <Text variant="h2">Khám phá</Text>
        <Text variant="caption" className="mt-1">Bấm vào item để xem detail</Text>
      </View>

      <FlashList
        data={ITEMS}
        estimatedItemSize={80}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
            onPress={() => router.push(`/(app)/detail?id=${item.id}&title=${item.title}`)}
          >
            <View className="flex-1">
              <Text variant="label">{item.title}</Text>
              <Text variant="caption" className="mt-0.5">{item.subtitle}</Text>
            </View>
            <View className="bg-primary-100 rounded-full px-2 py-0.5">
              <Text variant="caption" className="text-primary-700 font-semibold">{item.tag}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}
