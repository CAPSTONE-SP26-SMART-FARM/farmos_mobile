import { useState } from 'react'
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { icons } from '@/constants/icon'
import { useDoctorWalletSummary } from '@/hooks/useDoctorWallet'
import { formatNumber } from '@/utils/number'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'

const DolarIcon = icons.dolarSvg

export function EarningsCard() {
  const { data: summary, isLoading } = useDoctorWalletSummary()
  const [visible, setVisible] = useState(false)
  const balance = summary?.balance ?? 0

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <DolarIcon width={18} height={18} color='#15803D' />
          <Text style={styles.label}>Tổng doanh thu</Text>
          <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={10}>
            <MaterialIcons
              name={visible ? 'visibility' : 'visibility-off'}
              size={16}
              color='#9CA3AF'
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => router.push('/(app)/wallet')}
          activeOpacity={0.7}
        >
          <Text style={styles.detailText}>Xem ví →</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator color='#15803D' style={{ marginTop: 4 }} />
      ) : (
        <Text style={styles.amount}>{visible ? formatNumber(balance, 0) : '********'}</Text>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
  },
  amount: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
})
