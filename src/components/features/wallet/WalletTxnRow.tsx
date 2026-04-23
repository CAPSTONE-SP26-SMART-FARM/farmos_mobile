import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatVnd } from '@/utils/number'
import { formatDateTime } from '@/utils/date'
import type {
  DoctorWalletTransaction, DoctorWalletTransactionType,
} from '@/types/doctorWallet'

const TXN_META: Record<
  DoctorWalletTransactionType,
  { label: string; color: string; sign: '+' | '-' }
> = {
  EARNING: { label: 'Thu nhập', color: '#10B981', sign: '+' },
  WITHDRAWAL: { label: 'Rút tiền', color: '#EF4444', sign: '-' },
  PENALTY: { label: 'Phạt', color: '#F59E0B', sign: '-' },
}

export const TXN_TYPE_LABELS = TXN_META

interface WalletTxnRowProps {
  item: DoctorWalletTransaction
}

export function WalletTxnRow({ item }: WalletTxnRowProps) {
  const meta = TXN_META[item.transactionType]
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{meta.label}</Text>
        <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, { color: meta.color }]}>
        {meta.sign}{formatVnd(Math.abs(item.amount))}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 14, borderRadius: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 14, color: '#111827', fontFamily: 'Inter_500Medium' },
  date: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  amount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
})
