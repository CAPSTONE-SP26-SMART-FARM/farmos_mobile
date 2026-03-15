import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

interface InfoBoxProps {
  text: string
  showIcon?: boolean
}

export const InfoBox = ({ text, showIcon = false }: InfoBoxProps) => {
  return (
    <View style={[styles.container, showIcon && styles.containerWithIcon]}>
      {showIcon && <Ionicons name='bulb-outline' size={24} color='#2463EB' />}
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F6FF',
    borderColor: '#91C3FD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24
  },
  containerWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: '#111827', flex: 1 }
})
