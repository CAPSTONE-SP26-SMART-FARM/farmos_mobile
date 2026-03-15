import React from 'react'
import { SvgProps } from 'react-native-svg'

interface TabBarIconProps {
  focused: boolean
  Icon: React.FC<SvgProps>
  activeColor?: string
  inactiveColor?: string
  size?: number
}

export const TabBarIcon = ({
  focused,
  Icon,
  activeColor = '#2463EB',
  inactiveColor = '#6B7280',
  size = 24,
}: TabBarIconProps) => {
  const color = focused ? activeColor : inactiveColor
  return <Icon width={size} height={size} color={color} />
}
