import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { Text } from '@/components/ui'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const NOTIFS = [
  { id: '1', title: 'Đơn hàng đã được xác nhận', body: 'Đơn #1234 đang được xử lý', time: dayjs().subtract(5, 'minute').toDate(), read: false },
  { id: '2', title: 'Khuyến mãi hôm nay', body: 'Giảm 20% cho tất cả sản phẩm', time: dayjs().subtract(1, 'hour').toDate(), read: false },
  { id: '3', title: 'Giao hàng thành công', body: 'Đơn #1230 đã được giao', time: dayjs().subtract(3, 'hour').toDate(), read: true },
  { id: '4', title: 'Bạn có tin nhắn mới', body: 'Hỗ trợ: Xin chào, tôi có thể giúp gì?', time: dayjs().subtract(1, 'day').toDate(), read: true },
  { id: '5', title: 'Cập nhật ứng dụng', body: 'Phiên bản 2.0 đã sẵn sàng', time: dayjs().subtract(2, 'day').toDate(), read: true },
]

export default function NotificationsScreen() {
  const unreadCount = NOTIFS.filter(n => !n.read).length

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-6 pb-3 flex-row items-center gap-2">
        <Text variant="h2">Thông báo</Text>
        {unreadCount > 0 && (
          <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
            <Text variant="caption" className="text-white font-bold text-xs">{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlashList
        data={NOTIFS}
        estimatedItemSize={80}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => (
          <View className={`rounded-xl p-4 ${item.read ? 'bg-white' : 'bg-primary-50 border border-primary-100'}`}>
            {!item.read && (
              <View className="w-2 h-2 rounded-full bg-primary-600 absolute top-4 right-4" />
            )}
            <Text variant="label" className={item.read ? 'text-gray-700' : 'text-gray-900'}>
              {item.title}
            </Text>
            <Text variant="caption" className="mt-0.5 text-gray-500">{item.body}</Text>
            <Text variant="caption" className="mt-1 text-gray-400">{dayjs(item.time).fromNow()}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}
