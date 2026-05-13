import {
  View, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotification'
import { formatRelativeTime } from '@/utils/date'
import { icons } from '@/constants/icon'
import type { Notification } from '@/types/notification'

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  incident_accepted:          { icon: '🩺', color: '#059669', bg: '#D1FAE5' },
  incident_assigned:          { icon: '📋', color: '#2463EB', bg: '#EFF6FF' },
  prescription_created:       { icon: '💊', color: '#7C3AED', bg: '#EDE9FE' },
  ticket_message:             { icon: '💬', color: '#0891B2', bg: '#CFFAFE' },
  production_request_replied: { icon: '✅', color: '#16A34A', bg: '#DCFCE7' },
  production_request_created: { icon: '📤', color: '#D97706', bg: '#FEF3C7' },
  alert_triggered:            { icon: '⚠️', color: '#DC2626', bg: '#FEE2E2' },
  system:                     { icon: '🔔', color: '#6B7280', bg: '#F3F4F6' },
}

const getTypeMeta = (type: string) => TYPE_META[type] ?? TYPE_META.system

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
  const meta = getTypeMeta(item.type)

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Text style={styles.iconText}>{meta.icon}</Text>
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
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handlePress = (item: Notification) => {
    if (!item.isRead) markRead(item.id)
    const target = resolveRedirect(item.redirectUrl)
    if (target) router.push(target as any)
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title={`Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ''}`} />

      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
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
  iconText: { fontSize: 18 },
  itemContent: { flex: 1, gap: 3 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { fontSize: 14, color: '#374151', fontFamily: 'Inter_400Regular', flex: 1 },
  itemTitleUnread: { color: '#111827', fontFamily: 'Inter_600SemiBold' },
  itemTime: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', flexShrink: 0 },
  itemBody: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2463EB', marginTop: 4, flexShrink: 0,
  },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 8, marginTop: 4 },
  retryText: { color: '#2463EB', fontFamily: 'Inter_500Medium', fontSize: 14 },
})
