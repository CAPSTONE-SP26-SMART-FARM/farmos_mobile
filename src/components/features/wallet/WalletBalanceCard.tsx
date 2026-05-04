import { useState } from 'react'
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { formatNumber } from '@/utils/number'

interface WalletSummaryCardProps {
  todayRevenue: number
  balance: number
  loading?: boolean
}

export function WalletBalanceCard({ todayRevenue, balance, loading }: WalletSummaryCardProps) {
  const [visible, setVisible] = useState(false)

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
        <View style={styles.labelRow}>
          <Text style={styles.label}>Số dư hiện tại</Text>
          <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={10}>
            <MaterialIcons
              name={visible ? 'visibility' : 'visibility-off'}
              size={16}
              color='#9CA3AF'
            />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color='#2463EB' style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        ) : (
          <Text style={styles.value}>
            {visible ? formatNumber(balance, 0) : '********'}
          </Text>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
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
  },
  value: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
})
