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
    <View style={styles.group}>
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
  group: { gap: 8 },
  dateHeader: {
    fontSize: 13, color: '#4B5563',
    fontFamily: 'Inter_500Medium',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
})
