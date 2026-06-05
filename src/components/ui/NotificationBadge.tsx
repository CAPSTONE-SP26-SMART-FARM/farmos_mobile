import { View, StyleSheet } from 'react-native'
import { Text } from './Text'

interface NotificationBadgeProps {
  /** Số chưa đọc. 0 → không render. >99 → render "99+". */
  count: number
  /** Style override (vd absolute position trên icon). */
  style?: object
}

export function NotificationBadge({ count, style }: NotificationBadgeProps) {
  if (!count || count <= 0) return null
  const label = count > 99 ? '99+' : String(count)
  const isWide = label.length >= 2
  return (
    <View
      style={[
        styles.badge,
        isWide ? styles.badgeWide : styles.badgeNarrow,
        style,
      ]}
    >
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeNarrow: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
  },
  badgeWide: {
    minWidth: 24,
    height: 20,
    paddingHorizontal: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
})
