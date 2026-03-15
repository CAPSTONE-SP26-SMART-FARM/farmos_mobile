import React, { useEffect } from 'react'
import { StyleSheet, View, StyleProp, ViewStyle, Dimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

interface SkeletonProps {
  style?: StyleProp<ViewStyle>
  width?: number | string
  height?: number | string
  borderRadius?: number
}

export const Skeleton = ({
  style,
  width = '100%',
  height = 20,
  borderRadius = 4
}: SkeletonProps) => {
  const translateX = useSharedValue(-1)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false
    )
  }, [translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(translateX.value, [-1, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) }
    ]
  }))

  return (
    <View style={[styles.skeleton, { width: width as any, height: height as any, borderRadius }, style]}>
      <AnimatedLinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[{ ...StyleSheet.absoluteFillObject, width: '100%' }, animatedStyle]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#F5F6F8',
    overflow: 'hidden',
    position: 'relative'
  }
})
