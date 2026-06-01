import { ReactNode } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'

interface InlineFieldRowProps {
  field: ReactNode
  action: ReactNode
  style?: StyleProp<ViewStyle>
}

// Lays out a flexible input (left) next to a compact action button (right) on one row.
// Wraps the field in a flex:1 View so callers don't hit the TextField containerStyle pitfall
// (containerStyle applies to the inner box, not the outermost wrapper).
export const InlineFieldRow = ({ field, action, style }: InlineFieldRowProps) => {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.field}>{field}</View>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  field: { flex: 1 },
})
