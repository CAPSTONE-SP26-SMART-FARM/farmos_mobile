import { useState } from 'react'
import {
  View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TopBar, PillTabs, EmptyState, type PillTabItem } from '@/components/ui'
import { useWithdrawalList, useWithdrawalListeners } from '@/hooks/useWithdrawals'
import { WD_STATUS_META } from '@/constants/withdrawal'
import { formatVnd } from '@/utils/number'
import { formatDate } from '@/utils/date'
import type { WithdrawalRequest, WithdrawalStatus } from '@/types/withdrawal'

type FilterKey = 'all' | WithdrawalStatus

const FILTERS: readonly PillTabItem<FilterKey>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'paid', label: 'Đã chuyển' },
  { key: 'done', label: 'Hoàn tất' },
  { key: 'rejected', label: 'Bị từ chối' },
]

export default function WithdrawalListScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  useWithdrawalListeners()

  const {
    data, isLoading, refetch, isFetching,
  } = useWithdrawalList(filter === 'all' ? undefined : filter, 30)

  const items = data?.data ?? []

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Yêu cầu rút tiền' />

      <View style={styles.body}>
        <PillTabs items={FILTERS} value={filter} onChange={setFilter} style={styles.filter} />

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor='#2463EB' />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Row item={item} onPress={() => router.push({ pathname: '/(app)/withdrawal/[id]', params: { id: item.id } })} />
          )}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color='#2463EB' style={{ marginTop: 40 }} />
            ) : (
              <EmptyState message='Chưa có yêu cầu rút tiền nào.' />
            )
          }
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(app)/withdrawal/new')}>
        <MaterialIcons name='add' size={24} color='#FFFFFF' />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

function Row({ item, onPress }: { item: WithdrawalRequest; onPress: () => void }) {
  const meta = WD_STATUS_META[item.status]
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <Text style={styles.amount}>{formatVnd(item.amount)}</Text>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.bankInfo} numberOfLines={1}>
        {item.snapshotBankName} - {item.snapshotAccountNumber}
      </Text>
      <Text style={styles.date}>Ngày tạo: {formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  filter: { paddingHorizontal: 16, paddingTop: 12 },
  content: { padding: 16, paddingBottom: 80 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  bankInfo: { fontSize: 13, color: '#374151', fontFamily: 'Inter_400Regular' },
  date: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#2463EB',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
})
