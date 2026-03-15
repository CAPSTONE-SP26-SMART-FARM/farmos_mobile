import React from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface TabBarIconProps {
  focused: boolean
  name: keyof typeof Ionicons.glyphMap
  activeColor?: string
  inactiveColor?: string
  size?: number
}

export const TabBarIcon = ({
  focused,
  name,
  activeColor = '#2463EB',
  inactiveColor = '#6B7280',
  size = 24,
}: TabBarIconProps) => {
  const color = focused ? activeColor : inactiveColor
  return <Ionicons name={name} size={size} color={color} />
}
