import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatNumber } from '@/utils/number'

interface WalletSummaryCardProps {
  todayRevenue: number
  balance: number
  loading?: boolean
}

export function WalletBalanceCard({ todayRevenue, balance, loading }: WalletSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.col}>
        <Text style={styles.label}>Doanh thu hôm nay</Text>
        {loading ? (
          <ActivityIndicator color='#2463EB' style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        ) : (
          <Text style={styles.value}>{formatNumber(todayRevenue, 0)}</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.col}>
        <Text style={styles.label}>Số dư hiện tại</Text>
        {loading ? (
          <ActivityIndicator color='#2463EB' style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        ) : (
          <Text style={styles.value}>{formatNumber(balance, 0)}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
  },
  col: { flex: 1 },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  label: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
})
