import React, { useState, forwardRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Easing
} from 'react-native-reanimated'
import Ionicons from '@expo/vector-icons/Ionicons'

const COLORS = {
  primary: '#2463EB',
  error: '#DC2828',
  text: '#111827',
  textDisabled: '#9CA3B0',
  textReadonly: '#4B5563',
  textPlaceholder: '#9CA3AF',
  textLabelResting: '#9CA3AF',
  textLabelFloating: '#4B5563',
  borderDefault: '#E5E7EB',
  borderFocused: '#2463EB',
  borderError: '#DC2828',
  bgDefault: '#FFFFFF',
  bgDisabled: '#F0F2F5',
  bgReadonly: '#F0F2F5',
  iconClear: '#9CA3B0'
}

type InputState = 'normal' | 'focused' | 'error' | 'disabled' | 'readonly'

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
  readOnly?: boolean
  disabled?: boolean
  showClear?: boolean
  rightIcon?: keyof typeof Ionicons.glyphMap
  rightIconComponent?: React.ReactNode
  onRightIconPress?: () => void
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  showError?: boolean
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      value,
      defaultValue,
      error,
      readOnly,
      disabled,
      showClear = true,
      rightIcon,
      rightIconComponent,
      onRightIconPress,
      containerStyle,
      inputStyle,
      showError = true,
      onChangeText,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const currentVal = value !== undefined ? value : defaultValue
    const hasValue = !!currentVal && currentVal.length > 0
    const isFloating = isFocused || hasValue

    let state: InputState = 'normal'
    if (disabled) state = 'disabled'
    else if (readOnly) state = 'readonly'
    else if (error) state = 'error'
    else if (isFocused) state = 'focused'

    const floatAnim = useSharedValue(isFloating ? 1 : 0)

    useEffect(() => {
      floatAnim.value = withTiming(isFloating ? 1 : 0, {
        duration: 200,
        easing: Easing.out(Easing.cubic)
      })
    }, [isFloating, floatAnim])

    const labelStyle = useAnimatedStyle(() => ({
      top: interpolate(floatAnim.value, [0, 1], [18, 8]),
      fontSize: interpolate(floatAnim.value, [0, 1], [16, 12]),
      color: interpolateColor(
        floatAnim.value,
        [0, 1],
        [COLORS.textLabelResting, COLORS.textLabelFloating]
      )
    }))

    const borderStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(
        floatAnim.value,
        [0, 1],
        [
          state === 'error' ? COLORS.borderError : COLORS.borderDefault,
          state === 'error'
            ? COLORS.borderError
            : state === 'focused'
              ? COLORS.borderFocused
              : COLORS.borderDefault
        ]
      )
    }))

    const handleFocus = (e: any) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: any) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const isClearVisible =
      showClear && hasValue && isFocused && state !== 'error' && !readOnly && !disabled

    const activeColor =
      state === 'error'
        ? COLORS.error
        : state === 'focused'
          ? COLORS.primary
          : COLORS.textPlaceholder

    return (
      <View style={styles.wrapper}>
        <Animated.View
          style={[
            styles.container,
            state === 'disabled' && styles.containerDisabled,
            state === 'readonly' && styles.containerReadonly,
            borderStyle,
            containerStyle
          ]}
        >
          <Animated.Text style={[styles.label, labelStyle]} pointerEvents='none'>
            {label}
          </Animated.Text>

          <TextInput
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={state !== 'disabled' && state !== 'readonly'}
            placeholderTextColor='transparent'
            selectionColor={COLORS.primary}
            cursorColor={COLORS.primary}
            style={[
              styles.input,
              state === 'disabled' && styles.inputDisabled,
              state === 'readonly' && styles.inputReadonly,
              inputStyle
            ]}
            {...props}
          />

          <View style={styles.rightIcons}>
            {isClearVisible && (
              <Pressable onPress={() => onChangeText?.('')} hitSlop={12} style={styles.iconButton}>
                <Ionicons name='close-circle' size={20} color={COLORS.iconClear} />
              </Pressable>
            )}

            {state === 'error' && (
              <View style={styles.iconButton}>
                <Ionicons name='alert-circle-outline' size={20} color={COLORS.error} />
              </View>
            )}

            {!error && rightIconComponent && (
              <Pressable
                onPress={onRightIconPress}
                disabled={!onRightIconPress}
                style={styles.iconButton}
              >
                {rightIconComponent}
              </Pressable>
            )}

            {!error && !rightIconComponent && rightIcon && (
              <Pressable
                onPress={onRightIconPress}
                disabled={!onRightIconPress}
                style={styles.iconButton}
              >
                <Ionicons name={rightIcon} size={20} color={activeColor} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {showError && (
          <View style={styles.errorContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        )}
      </View>
    )
  }
)

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 0
  },
  container: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: COLORS.bgDefault,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  containerDisabled: {
    backgroundColor: COLORS.bgDisabled,
    borderColor: COLORS.borderDefault
  },
  containerReadonly: {
    backgroundColor: COLORS.bgReadonly,
    borderColor: COLORS.borderDefault
  },
  label: {
    position: 'absolute',
    left: 16,
    zIndex: 1
  },
  input: {
    flex: 1,
    height: 56,
    paddingTop: 24,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: 'center'
  },
  inputDisabled: {
    color: COLORS.textDisabled
  },
  inputReadonly: {
    color: '#4B5563'
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8
  },
  iconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    minHeight: 20,
    justifyContent: 'center'
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4
  }
})
