import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { formatVnd } from '@/utils/number'
import { formatTime } from '@/utils/date'
import { icons } from '@/constants/icon'
import type {
  DoctorWalletTransaction, DoctorWalletTransactionType,
} from '@/types/doctorWallet'

const SendMoneyIcon = icons.sendMoneySvg
const TimerPauseIcon = icons.timerPauseSvg
const FinanceChipIcon = icons.financeChipSvg

const GREEN = '#299f47'
const RED = '#DC2828'
const AMBER = '#D97706'

const TXN_META: Record<
  DoctorWalletTransactionType,
  { label: string; color: string; sign: '+' | '-'; Icon: typeof SendMoneyIcon }
> = {
  EARNING:            { label: 'Thu nhập',     color: GREEN, sign: '+', Icon: FinanceChipIcon },
  WITHDRAWAL:         { label: 'Rút tiền',     color: RED,   sign: '-', Icon: SendMoneyIcon },
  WITHDRAWAL_PENDING: { label: 'Đang chờ rút', color: AMBER, sign: '-', Icon: TimerPauseIcon },
  WITHDRAWAL_REFUND:  { label: 'Hoàn rút',     color: GREEN, sign: '+', Icon: FinanceChipIcon },
  PENALTY:            { label: 'Phạt',         color: RED,   sign: '-', Icon: SendMoneyIcon },
}

const FALLBACK_META: typeof TXN_META[DoctorWalletTransactionType] = {
  label: 'Khác', color: '#6B7280', sign: '-', Icon: FinanceChipIcon,
}

interface WalletTxnRowProps {
  item: DoctorWalletTransaction
  balanceAfter?: number
  showDivider?: boolean
}

export function WalletTxnRow({ item, balanceAfter, showDivider }: WalletTxnRowProps) {
  const meta = TXN_META[item.transactionType] ?? FALLBACK_META
  const Icon = meta.Icon
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Icon width={24} height={24} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{meta.label}</Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: meta.color }]}>
            {meta.sign}{formatVnd(Math.abs(item.amount))}
          </Text>
          {balanceAfter !== undefined && (
            <Text style={styles.balance}>Số dư ví: {formatVnd(balanceAfter)}</Text>
          )}
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  label: { fontSize: 14, color: '#111827', fontFamily: 'Inter_500Medium' },
  time: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  amount: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  balance: { fontSize: 11, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 72 },
})
