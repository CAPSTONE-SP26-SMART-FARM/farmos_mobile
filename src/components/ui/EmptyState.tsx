import type { ComponentType } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { Text } from './Text'

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  Icon?: ComponentType<SvgProps>
  iconSize?: number
}

export function EmptyState({ message, actionLabel, onAction, Icon, iconSize = 120 }: EmptyStateProps) {
  return (
    <View style={styles.box}>
      {Icon ? <Icon width={iconSize} height={iconSize} /> : null}
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.btn}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 20 },
  text: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular', textAlign: 'center' },
  btn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#DCFCE7', borderRadius: 8 },
  btnText: { color: '#15803D', fontFamily: 'Inter_500Medium', fontSize: 14 },
})
