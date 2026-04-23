import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Text } from './Text'

export interface PillTabItem<T extends string> {
  key: T
  label: string
}

interface PillTabsProps<T extends string> {
  items: readonly PillTabItem<T>[]
  value: T
  onChange: (key: T) => void
  style?: ViewStyle
}

export function PillTabs<T extends string>({ items, value, onChange, style }: PillTabsProps<T>) {
  return (
    <View style={[styles.row, style]}>
      {items.map((tab) => {
        const active = value === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: { backgroundColor: '#2463EB' },
  label: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_500Medium' },
  labelActive: { color: '#fff' },
})
