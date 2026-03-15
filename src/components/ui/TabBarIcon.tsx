import React from 'react'
import { View, StyleSheet } from 'react-native'

interface TabBarIconProps {
  focused: boolean
  Icon: React.FC<{ width: number; height: number; color: string }>
  size?: number
}

export const TabBarIcon = ({ focused, Icon, size = 24 }: TabBarIconProps) => {
  return (
    <View style={styles.container}>
      <Icon
        width={size}
        height={size}
        color={focused ? '#2463EB' : '#6B7280'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})
