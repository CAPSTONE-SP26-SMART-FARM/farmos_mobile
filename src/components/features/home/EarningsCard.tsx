import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui'
import { useDoctorWalletSummary } from '@/hooks/useDoctorWallet'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'

export function EarningsCard() {
  const { data: summary, isLoading } = useDoctorWalletSummary()
  const balance = summary?.balance ?? 0

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.label}>Thu nhập của bạn</Text>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => router.push('/(app)/wallet')}
          activeOpacity={0.7}
        >
          <Text style={styles.detailText}>Xem ví →</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator color='#2463EB' style={{ marginTop: 4 }} />
      ) : (
        <Text style={styles.amount}>{balance.toLocaleString('vi-VN')} ₫</Text>
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
