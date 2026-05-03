import { useMemo, useState } from 'react'
import {
  View, StyleSheet, ActivityIndicator, RefreshControl, FlatList, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TopBar, PillTabs, EmptyState, type PillTabItem } from '@/components/ui'
import { useDoctorWalletSummary, useDoctorWalletTransactions } from '@/hooks/useDoctorWallet'
import { useWithdrawalList, useWithdrawalListeners } from '@/hooks/useWithdrawals'
import { WalletBalanceCard } from '@/components/features/wallet/WalletBalanceCard'
import { WalletTxnGroup, type TxnWithBalance } from '@/components/features/wallet/WalletTxnGroup'
import { icons } from '@/constants/icon'
import { WD_STATUS_META } from '@/constants/withdrawal'
import { formatVnd } from '@/utils/number'
import { isToday, toDateKey } from '@/utils/date'
import type { DoctorWalletTransaction } from '@/types/doctorWallet'
import type { WithdrawalRequest } from '@/types/withdrawal'

const OutputIcon = icons.outputSvg

type FilterKey = 'all' | 'EARNING'

const FILTERS: readonly PillTabItem<FilterKey>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'EARNING', label: 'Thu nhập' },
]

/** Inflow types tăng số dư: EARNING + WITHDRAWAL_REFUND */
function isInflow(t: DoctorWalletTransaction): boolean {
  return t.transactionType === 'EARNING' || t.transactionType === 'WITHDRAWAL_REFUND'
}

/**
 * Tính balanceAfter cho từng giao dịch (mới → cũ).
 * Chỉ chính xác khi `txns` là TOÀN BỘ giao dịch không bị filter (vì số dư phụ thuộc mọi loại txn).
 * Nếu filter !== 'all' → trả undefined cho balanceAfter.
 */
function withBalanceAfter(
  txns: DoctorWalletTransaction[], currentBalance: number, includeBalance: boolean,
): TxnWithBalance[] {
  if (!includeBalance) return txns.map((t) => ({ ...t }))
  let bal = currentBalance
  const result: TxnWithBalance[] = []
  for (const t of txns) {
    result.push({ ...t, balanceAfter: bal })
    bal -= (isInflow(t) ? 1 : -1) * t.amount
  }
  return result
}

function groupByDate(items: TxnWithBalance[]): Array<{ date: string; items: TxnWithBalance[] }> {
  const map: Record<string, TxnWithBalance[]> = {}
  for (const t of items) {
    const key = toDateKey(t.createdAt)
    if (!map[key]) map[key] = []
    map[key].push(t)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

export default function WalletScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  useWithdrawalListeners()

  const {
    data: summary, isLoading: summaryLoading, refetch: refetchSummary, isFetching,
  } = useDoctorWalletSummary()

  const {
    data: txData, isLoading: txLoading, refetch: refetchTx,
  } = useDoctorWalletTransactions(1, filter === 'all' ? undefined : filter)

  const { data: allTxData } = useDoctorWalletTransactions(1, undefined)
  const { data: wdData, refetch: refetchWd } = useWithdrawalList(undefined, 5)

  const txs = txData?.data ?? []
  const allTxs = allTxData?.data ?? []
  const recentWds = wdData?.data ?? []
  const balance = summary?.balance ?? 0

  const todayRevenue = useMemo(
    () =>
      allTxs
        .filter((t) => t.transactionType === 'EARNING' && isToday(t.createdAt))
        .reduce((sum, t) => sum + t.amount, 0),
    [allTxs],
  )

  // Group + tính balanceAfter (chỉ chính xác khi filter='all')
  const groups = useMemo(
    () => groupByDate(withBalanceAfter(txs, balance, filter === 'all')),
    [txs, balance, filter],
  )

  const handleRefresh = () => {
    refetchSummary()
    refetchTx()
    refetchWd()
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Ví của tôi' />

      <FlatList
        style={styles.body}
        data={groups}
        keyExtractor={(g) => g.date}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} tintColor='#2463EB' />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item }) => <WalletTxnGroup date={item.date} items={item.items} />}
        ListHeaderComponent={
          <>
            <WalletBalanceCard
              todayRevenue={todayRevenue}
              balance={balance}
              loading={summaryLoading}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(app)/withdrawal/new')}
              >
                <OutputIcon width={22} height={22} color='#299f47' />
                <Text style={[styles.actionBtnText, { color: '#299f47' }]}>Rút tiền</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(app)/bank-accounts')}
              >
                <MaterialIcons name='account-balance' size={22} color='#2463EB' />
                <Text style={styles.actionBtnText}>Tài khoản NH</Text>
              </TouchableOpacity>
            </View>

            {/* Recent withdrawals */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleInline}>Yêu cầu rút gần đây</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/withdrawal')}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {recentWds.length === 0 ? (
              <View style={styles.wdEmpty}>
                <Text style={styles.wdEmptyText}>Chưa có yêu cầu rút nào</Text>
              </View>
            ) : (
              <View style={styles.wdGroup}>
                {recentWds.map((item) => <WdRow key={item.id} item={item} onPress={() =>
                  router.push({ pathname: '/(app)/withdrawal/[id]', params: { id: item.id } })
                } />)}
              </View>
            )}

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

function WdRow({ item, onPress }: { item: WithdrawalRequest; onPress: () => void }) {
  const meta = WD_STATUS_META[item.status]
  return (
    <TouchableOpacity style={styles.wdRow} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.wdAmount}>{formatVnd(item.amount)}</Text>
        <Text style={styles.wdBank} numberOfLines={1}>
          {item.snapshotBankName} - {item.snapshotAccountNumber}
        </Text>
      </View>
      <View style={[styles.wdBadge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.wdBadgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 24 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionBtnText: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_500Medium' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold',
    marginTop: 20, marginBottom: 10,
  },
  sectionTitleInline: {
    fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold',
  },
  seeAll: { fontSize: 13, color: '#2463EB', fontFamily: 'Inter_500Medium' },

  wdGroup: { gap: 8 },
  wdRow: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  wdAmount: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#111827', marginBottom: 2 },
  wdBank: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  wdBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  wdBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  wdEmpty: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 20, alignItems: 'center',
  },
  wdEmptyText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },

  filter: { marginBottom: 12 },
})
