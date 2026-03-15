import React from 'react'
import {
  Text as NativeText,
  TextProps as NativeTextProps,
  TextStyle as NativeTextStyle,
  StyleProp,
  StyleSheet
} from 'react-native'
import { InterFontFamily } from '@/constants/theme'

type TextStyle = Omit<NativeTextStyle, 'fontFamily'> & {
  fontFamily?: InterFontFamily | (string & {})
}

interface TextProps extends Omit<NativeTextProps, 'style'> {
  style?: StyleProp<TextStyle>
}

export const Text = ({ style, ...props }: TextProps) => {
  return <NativeText style={[styles.base, style as NativeTextStyle]} {...props} />
}

export const TextBold = ({ style, ...props }: TextProps) => {
  return (
    <NativeText style={[styles.base, styles.bold, style as NativeTextStyle]} {...props} />
  )
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Inter_400Regular'
  },
  bold: {
    fontFamily: 'Inter_600SemiBold'
  }
})
