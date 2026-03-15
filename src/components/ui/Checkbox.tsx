import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from './Text'

interface CheckboxProps {
  label: React.ReactNode
  checked: boolean
  onPress: () => void
  disabled?: boolean
  readOnly?: boolean
}

export const Checkbox = ({
  label,
  checked,
  onPress,
  disabled = false,
  readOnly = false
}: CheckboxProps) => {
  const isInteractionDisabled = disabled || readOnly
  return (
    <Pressable
      style={[styles.row, readOnly && styles.opacityActive]}
      onPress={isInteractionDisabled ? undefined : onPress}
      disabled={isInteractionDisabled}
    >
      <View style={[styles.box, checked && styles.boxChecked, disabled && styles.boxDisabled]}>
        {checked && <MaterialIcons name='check' size={14} color='#FFFFFF' />}
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 2, gap: 12 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1
  },
  boxChecked: { borderColor: '#2463EB', backgroundColor: '#2463EB' },
  boxDisabled: { borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' },
  label: { flex: 1, fontSize: 14, lineHeight: 20, color: '#111827' },
  labelDisabled: { color: '#9CA3AF' },
  opacityActive: { opacity: 0.7 }
})
