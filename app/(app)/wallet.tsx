import { useMemo, useState } from 'react'
import {
  View, StyleSheet, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, TopBar, PillTabs, EmptyState, type PillTabItem } from '@/components/ui'
import { useDoctorWalletSummary, useDoctorWalletTransactions } from '@/hooks/useDoctorWallet'
import { WalletBalanceCard } from '@/components/features/wallet/WalletBalanceCard'
import { WalletTxnRow } from '@/components/features/wallet/WalletTxnRow'

type FilterKey = 'all' | 'EARNING'

const FILTERS: readonly PillTabItem<FilterKey>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'EARNING', label: 'Thu nhập' },
]

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function WalletScreen() {
  const [filter, setFilter] = useState<FilterKey>('all')

  const {
    data: summary, isLoading: summaryLoading, refetch: refetchSummary, isFetching,
  } = useDoctorWalletSummary()

  // Query luôn cho danh sách hiển thị (theo filter)
  const {
    data: txData, isLoading: txLoading, refetch: refetchTx,
  } = useDoctorWalletTransactions(1, filter === 'all' ? undefined : filter)

  // Query unfiltered để tính doanh thu hôm nay (TanStack cache dedup khi filter='all')
  const { data: allTxData } = useDoctorWalletTransactions(1, undefined)

  const txs = txData?.data ?? []
  const allTxs = allTxData?.data ?? []

  const todayRevenue = useMemo(
    () =>
      allTxs
        .filter((t) => t.transactionType === 'EARNING' && isToday(t.createdAt))
        .reduce((sum, t) => sum + t.amount, 0),
    [allTxs],
  )

  const handleRefresh = () => {
    refetchSummary()
    refetchTx()
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Ví của tôi' />

      <FlatList
        style={styles.body}
        data={txs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} tintColor='#2463EB' />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => <WalletTxnRow item={item} />}
        ListHeaderComponent={
          <>
            <WalletBalanceCard
              todayRevenue={todayRevenue}
              balance={summary?.balance ?? 0}
              loading={summaryLoading}
            />
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <PillTabs items={FILTERS} value={filter} onChange={setFilter} style={styles.filter} />
          </>
        }
        ListEmptyComponent={
          txLoading ? (
            <ActivityIndicator color='#2463EB' style={{ marginTop: 24 }} />
          ) : (
            <EmptyState message='Chưa có giao dịch nào.' />
          )
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold',
    marginTop: 20, marginBottom: 10,
  },
  filter: { marginBottom: 12 },
})
