import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { Text } from '@/components/ui'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const NOTIFS = [
  { id: '1', title: 'Đơn hàng đã được xác nhận', body: 'Đơn #1234 đang được xử lý', time: dayjs().subtract(5, 'minute').toDate(), read: false },
  { id: '2', title: 'Khuyến mãi hôm nay', body: 'Giảm 20% cho tất cả sản phẩm', time: dayjs().subtract(1, 'hour').toDate(), read: false },
  { id: '3', title: 'Giao hàng thành công', body: 'Đơn #1230 đã được giao', time: dayjs().subtract(3, 'hour').toDate(), read: true },
  { id: '4', title: 'Bạn có tin nhắn mới', body: 'Hỗ trợ: Xin chào, tôi có thể giúp gì?', time: dayjs().subtract(1, 'day').toDate(), read: true },
]

export default function NotificationsScreen() {
  const unreadCount = NOTIFS.filter((n) => !n.read).length

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <FlashList
        data={NOTIFS}
        estimatedItemSize={88}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.cardUnread]}>
            {!item.read && <View style={styles.dot} />}
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
              {item.title}
            </Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardTime}>{dayjs(item.time).fromNow()}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter_700Bold' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  separator: { height: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, gap: 4 },
  cardUnread: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  dot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2463EB' },
  cardTitle: { fontSize: 14, color: '#374151', fontFamily: 'Inter_500Medium', paddingRight: 16 },
  cardTitleUnread: { color: '#111827', fontFamily: 'Inter_600SemiBold' },
  cardBody: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  cardTime: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
})
