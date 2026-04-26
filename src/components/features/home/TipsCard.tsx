import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui'
import { icons } from '@/constants/icon'
import Animated, { FadeInDown } from 'react-native-reanimated'

const BulkBgIcon = icons.bulkBgSvg

interface Props {
  title: string
  description: string
  onPress?: () => void
  delay?: number
}

export function TipsCard({ title, description, onPress, delay = 250 }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(25).stiffness(180)}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
      >
        <BulkBgIcon width={44} height={44} />
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
})
