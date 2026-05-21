import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui'
import { icons } from '@/constants/icon'
import { useFarmerCurrentUpcomingMilestones } from '@/hooks/useFarmerMilestones'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'

const StorefrontIcon = icons.storefrontSvg

export function FarmStatusCard() {
  const { data: milestones = [], isLoading } = useFarmerCurrentUpcomingMilestones()
  const inProgress = milestones.filter((m) => m.status === 'in_progress')
  const upcoming = milestones.filter((m) => m.status === 'pending')

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(150).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <Text style={styles.sectionTitle}>Trang trại của bạn</Text>
      <TouchableOpacity
        style={styles.itemRow}
        activeOpacity={0.7}
        onPress={() => router.push('/(app)/(tabs)/farm')}
      >
        <View style={styles.iconWrapper}>
          <StorefrontIcon width={22} height={22} color='#2463EB' />
        </View>
        <View style={styles.content}>
          {isLoading ? (
            <Text style={styles.statusText}>Đang tải...</Text>
          ) : milestones.length === 0 ? (
            <>
              <Text style={styles.statusText}>Chưa có giai đoạn nào</Text>
              <Text style={styles.subText}>Liên hệ chủ trang trại để được phân công</Text>
            </>
          ) : (
            <>
              <Text style={styles.statusText}>
                {inProgress.length} giai đoạn đang diễn ra
              </Text>
              <Text style={styles.subText}>
                {upcoming.length > 0 ? `${upcoming.length} sắp tới · ` : ''}
                Nhấn để xem chi tiết
              </Text>
            </>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingTop: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 14,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  chevron: {
    fontSize: 22,
    color: '#9CA3AF',
    lineHeight: 26,
  },
})
