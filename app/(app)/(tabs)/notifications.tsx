import {
  View, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { useNotifications, useMarkNotificationRead, useUnreadNotificationCount } from '@/hooks/useNotification'
import { formatRelativeTime } from '@/utils/date'
import { resolveNotificationIcon } from '@/utils/notification'
import { icons } from '@/constants/icon'
import type { Notification } from '@/types/notification'

// BE redirectUrl `/tickets/:id` → FE route `/(app)/incident/:id`
function resolveRedirect(redirectUrl: string | null | undefined): string | null {
  if (!redirectUrl) return null
  const m = redirectUrl.match(/\/tickets\/([^/]+)/)
  if (m?.[1]) return `/(app)/incident/${m[1]}`
  return redirectUrl
}

function NotificationItem({
  item,
  onPress,
}: {
  item: Notification
  onPress: (item: Notification) => void
}) {
  const meta = resolveNotificationIcon(item.type, item.title)

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <MaterialIcons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text
            style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.itemTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>{item.content}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  const notifications = data?.data ?? []
  // Source unread count từ endpoint riêng (BE round 5, field `unreadCount`).
  // Trong lúc query loading lần đầu (data undefined) → fallback đếm theo page
  // hiện tại để badge không nhấp nháy về 0.
  const { data: unread } = useUnreadNotificationCount()
  const unreadCount =
    unread?.unreadCount ?? notifications.filter((n) => !n.isRead).length

  const handlePress = (item: Notification) => {
    if (!item.isRead) markRead(item.id)
    const target = resolveRedirect(item.redirectUrl)
    if (target) {
      router.push(target as any)
      return
    }
    if (item.type === 'alert_triggered' || (item.type as string) === 'sensor_alert') {
      router.push('/(app)/(tabs)/alerts')
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title={`Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ''}`} />

      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color='#15803D' />
        ) : isError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Không thể tải thông báo.</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState message='Chưa có thông báo nào.' Icon={icons.emptyCartSvg} />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem item={item} onPress={handlePress} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            onRefresh={() => refetch()}
            refreshing={isLoading}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { paddingVertical: 8 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
  },
  itemUnread: { backgroundColor: '#F0F7FF' },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemContent: { flex: 1, gap: 3 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { fontSize: 14, color: '#374151', fontFamily: 'Inter_400Regular', flex: 1 },
  itemTitleUnread: { color: '#111827', fontFamily: 'Inter_600SemiBold' },
  itemTime: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', flexShrink: 0 },
  itemBody: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#DC2626', marginTop: 4, flexShrink: 0,
  },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#DCFCE7', borderRadius: 8, marginTop: 4 },
  retryText: { color: '#15803D', fontFamily: 'Inter_500Medium', fontSize: 14 },
})
