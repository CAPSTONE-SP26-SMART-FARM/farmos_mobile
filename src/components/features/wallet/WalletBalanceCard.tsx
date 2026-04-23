import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatVnd } from '@/utils/number'
import { formatDateTime } from '@/utils/date'

interface WalletBalanceCardProps {
  balance: number
  updatedAt: string | null
  loading?: boolean
}

export function WalletBalanceCard({ balance, updatedAt, loading }: WalletBalanceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Số dư hiện tại</Text>
      {loading ? (
        <ActivityIndicator color='#fff' style={{ marginTop: 10 }} />
      ) : (
        <Text style={styles.value}>{formatVnd(balance)}</Text>
      )}
      {updatedAt && (
        <Text style={styles.updated}>Cập nhật: {formatDateTime(updatedAt)}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2463EB', borderRadius: 16, padding: 24, gap: 6 },
  label: { color: '#DBEAFE', fontSize: 13, fontFamily: 'Inter_500Medium' },
  value: { color: '#fff', fontSize: 32, fontFamily: 'Inter_700Bold' },
  updated: { color: '#BFDBFE', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
})
