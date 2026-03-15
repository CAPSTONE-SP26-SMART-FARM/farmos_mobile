import React from 'react'
import {
  Modal,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform
} from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Text, TextBold } from './Text'
import { PrimaryButton, SecondaryButton } from './Button'
import Ionicons from '@expo/vector-icons/Ionicons'

interface AlertProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
}

interface AlertSubComponents {
  Icon: React.FC<{ name: keyof typeof Ionicons.glyphMap; color?: string; backgroundColor?: string }>
  Title: React.FC<{ children: string; style?: StyleProp<TextStyle> }>
  Description: React.FC<{ children: string; style?: StyleProp<TextStyle> }>
  Actions: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>
  Action: React.FC<{
    title: string
    onPress: () => void
    variant?: 'primary' | 'secondary'
    style?: StyleProp<ViewStyle>
  }>
}

export const Alert: React.FC<AlertProps> & AlertSubComponents = ({
  visible,
  onClose,
  children,
  containerStyle
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType='none'
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.screenCenter}>
        {visible && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.overlay}
          >
            <TouchableWithoutFeedback onPress={onClose}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
          </Animated.View>
        )}
        {visible && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[styles.alertContainer, containerStyle]}
          >
            {children}
          </Animated.View>
        )}
      </View>
    </Modal>
  )
}

Alert.Icon = ({ name, color = '#F2994A', backgroundColor = '#FEF3C7' }) => (
  <View style={[styles.iconWrapper, { backgroundColor }]}>
    <Ionicons name={name} size={32} color={color} />
  </View>
)

Alert.Title = ({ children, style }) => (
  <TextBold style={[styles.title, style]}>{children}</TextBold>
)

Alert.Description = ({ children, style }) => (
  <Text style={[styles.description, style]}>{children}</Text>
)

Alert.Actions = ({ children, style }) => (
  <View style={[styles.actionsContainer, style]}>{children}</View>
)

Alert.Action = ({ title, onPress, variant = 'primary', style }) => {
  return variant === 'secondary' ? (
    <SecondaryButton title={title} onPress={onPress} style={[styles.actionButton, style]} />
  ) : (
    <PrimaryButton title={title} onPress={onPress} style={[styles.actionButton, style]} />
  )
}

const styles = StyleSheet.create({
  screenCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20
      },
      android: { elevation: 10 }
    })
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  actionButton: {
    flex: 1,
    minHeight: 48
  }
})

export default Alert
