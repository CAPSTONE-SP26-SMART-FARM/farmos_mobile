import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui'

const CARDS = [
  { id: '1', label: 'Doanh thu', value: '₫12.4M', change: '+8.2%', up: true },
  { id: '2', label: 'Đơn hàng', value: '284', change: '+12%', up: true },
  { id: '3', label: 'Khách hàng', value: '1,029', change: '-2.1%', up: false },
  { id: '4', label: 'Tồn kho', value: '538', change: '+0.5%', up: true },
]

export default function HomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="px-4 pt-6 pb-10 gap-5">
        <View>
          <Text variant="caption" className="text-gray-400">Chào buổi sáng,</Text>
          <Text variant="h2">Boilerplate Demo</Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {CARDS.map(card => (
            <View key={card.id} className="bg-white rounded-2xl p-4 flex-1 min-w-[140px]">
              <Text variant="caption" className="text-gray-400">{card.label}</Text>
              <Text variant="h3" className="mt-1">{card.value}</Text>
              <Text variant="caption" className={card.up ? 'text-green-600' : 'text-red-500'}>
                {card.change}
              </Text>
            </View>
          ))}
        </View>

        <View>
          <Text variant="label" className="mb-3 text-gray-500">Thao tác nhanh</Text>
          <View className="gap-2">
            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
              onPress={() => router.push('/(app)/(tabs)/explore')}
            >
              <Text variant="body">Khám phá danh sách (FlashList)</Text>
              <Text variant="body" className="text-gray-400">→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
              onPress={() => router.push('/(app)/detail?id=0&title=Demo Detail')}
            >
              <Text variant="body">Xem màn hình Detail (Stack)</Text>
              <Text variant="body" className="text-gray-400">→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
              onPress={() => router.push('/(app)/(tabs)/notifications')}
            >
              <Text variant="body">Thông báo (với badge)</Text>
              <Text variant="body" className="text-gray-400">→</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
