import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
  StyleProp
} from 'react-native'

interface BaseButtonProps extends TouchableOpacityProps {
  loading?: boolean
  children?: React.ReactNode
  size?: 'medium' | 'small'
}

interface CompoundButtonProps extends BaseButtonProps {
  title?: string
  icon?: React.ReactNode
  textStyle?: TextStyle
}

interface ButtonSubComponents {
  Text: React.FC<{ children: string; style?: StyleProp<TextStyle> }>
  Icon: React.FC<{ children: React.ReactNode }>
  Loading: React.FC<{ color?: string; size?: 'medium' | 'small' }>
}

export const Button: React.FC<BaseButtonProps> & ButtonSubComponents = ({
  children,
  style,
  loading,
  disabled,
  size = 'medium',
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === 'small' ? styles.small : styles.medium,
        (disabled || loading) && styles.disabled,
        style
      ]}
      activeOpacity={0.8}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Button.Loading size={size} /> : children}
    </TouchableOpacity>
  )
}

Button.Text = ({ children, style }) => (
  <Text style={[styles.text, style]}>{children}</Text>
)

Button.Icon = ({ children }) => <View style={styles.iconContainer}>{children}</View>

Button.Loading = ({ color = '#FFFFFF', size = 'medium' }) => (
  <View style={size === 'small' ? styles.loadingContainerSmall : styles.loadingContainer}>
    <ActivityIndicator color={color} size='small' />
  </View>
)

export const PrimaryButton = ({
  title,
  icon,
  style,
  textStyle,
  loading,
  size = 'medium',
  ...props
}: CompoundButtonProps) => {
  return (
    <Button style={[styles.primary, style]} loading={loading} size={size} {...props}>
      {icon && <Button.Icon>{icon}</Button.Icon>}
      <Button.Text style={[styles.primaryText, textStyle]}>{title || ''}</Button.Text>
    </Button>
  )
}

export const SecondaryButton = ({
  title,
  style,
  textStyle,
  loading,
  size = 'medium',
  ...props
}: CompoundButtonProps) => {
  return (
    <Button style={[styles.secondary, style]} loading={loading} size={size} {...props}>
      <Button.Text style={[styles.secondaryText, textStyle]}>{title || ''}</Button.Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 48
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: 8
  },
  disabled: {
    opacity: 0.6
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24
  },
  iconContainer: {
    marginLeft: 4
  },
  loadingContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainerSmall: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  primary: {
    backgroundColor: '#2463EB'
  },
  primaryText: {
    color: '#FFFFFF'
  },
  secondary: {
    backgroundColor: '#F3F4F6'
  },
  secondaryText: {
    color: '#1F2937'
  }
})

export default Button
