import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatDayHeader } from '@/utils/date'
import { WalletTxnRow } from './WalletTxnRow'
import type { DoctorWalletTransaction } from '@/types/doctorWallet'

export type TxnWithBalance = DoctorWalletTransaction & { balanceAfter?: number }

interface WalletTxnGroupProps {
  date: string
  items: TxnWithBalance[]
}

export function WalletTxnGroup({ date, items }: WalletTxnGroupProps) {
  return (
    <View>
      <Text style={styles.dateHeader}>{formatDayHeader(date)}</Text>
      <View style={styles.card}>
        {items.map((item, i) => (
          <WalletTxnRow
            key={item.id}
            item={item}
            balanceAfter={item.balanceAfter}
            showDivider={i < items.length - 1}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  dateHeader: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
})
