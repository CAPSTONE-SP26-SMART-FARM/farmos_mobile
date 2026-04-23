import { useState } from 'react'
import {
  View, StyleSheet, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, TopBar, PillTabs, EmptyState, type PillTabItem } from '@/components/ui'
import { useDoctorWalletSummary, useDoctorWalletTransactions } from '@/hooks/useDoctorWallet'
import { WalletBalanceCard } from '@/components/features/wallet/WalletBalanceCard'
import { WalletTxnRow } from '@/components/features/wallet/WalletTxnRow'
import type { DoctorWalletTransactionType } from '@/types/doctorWallet'

type FilterKey = 'all' | DoctorWalletTransactionType

const FILTERS: readonly PillTabItem<FilterKey>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'EARNING', label: 'Thu nhập' },
  { key: 'WITHDRAWAL', label: 'Rút tiền' },
  { key: 'PENALTY', label: 'Phạt' },
]

export default function WalletScreen() {
  const [filter, setFilter] = useState<FilterKey>('all')

  const {
    data: summary, isLoading: summaryLoading, refetch: refetchSummary, isFetching,
  } = useDoctorWalletSummary()
  const {
    data: txData, isLoading: txLoading, refetch: refetchTx,
  } = useDoctorWalletTransactions(1, filter === 'all' ? undefined : filter)

  const txs = txData?.data ?? []

  const handleRefresh = () => {
    refetchSummary()
    refetchTx()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title='Ví của tôi' />

      <FlatList
        data={txs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} tintColor='#2463EB' />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => <WalletTxnRow item={item} />}
        ListHeaderComponent={
          <>
            <WalletBalanceCard
              balance={summary?.balance ?? 0}
              updatedAt={summary?.updatedAt ?? null}
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
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold',
    marginTop: 24, marginBottom: 10,
  },
  filter: { marginBottom: 12 },
})
