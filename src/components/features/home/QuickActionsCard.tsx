import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui'
import Animated, { FadeInDown } from 'react-native-reanimated'
import type React from 'react'

export interface QuickActionItem {
  Icon: React.ComponentType<{ width: number; height: number; color?: string }>
  label: string
  onPress: () => void
  selfContained?: boolean
}

interface Props {
  items: QuickActionItem[]
  delay?: number
}

export function QuickActionsCard({ items, delay = 200 }: Props) {
  const is2Item = items.length === 2

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(25).stiffness(180)}
      style={styles.card}
    >
      <Text style={styles.sectionTitle}>Tiện ích</Text>
      <View style={[styles.grid, is2Item && styles.grid2]}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.gridItem}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <View style={[styles.gridIconWrapper, item.selfContained && styles.gridIconWrapperTransparent]}>
              <item.Icon
                width={item.selfContained ? 44 : 24}
                height={item.selfContained ? 44 : 24}
                color='#15803D'
              />
            </View>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 20,
  },
  grid2: {
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 100,
  },
  gridItem: {
    alignItems: 'center',
    gap: 8,
  },
  gridIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridIconWrapperTransparent: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  gridLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
    textAlign: 'center',
    marginTop: 5,
  },
})
