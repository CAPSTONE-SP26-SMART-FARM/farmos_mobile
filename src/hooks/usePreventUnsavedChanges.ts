import { Alert } from 'react-native'
import { useNavigation } from 'expo-router'
import { usePreventRemove, type NavigationAction } from '@react-navigation/native'

export function usePreventUnsavedChanges(
  shouldPrevent: boolean,
  options?: {
    title?: string
    message?: string
    stayText?: string
    exitText?: string
    onBeforeExit?: () => void | Promise<void>
  },
) {
  const navigation = useNavigation()
  const {
    title = 'Bạn chưa lưu thay đổi',
    message,
    stayText = 'Tiếp tục',
    exitText = 'Không lưu',
    onBeforeExit,
  } = options ?? {}

  usePreventRemove(shouldPrevent, ({ data }: { data: { action: NavigationAction } }) => {
    Alert.alert(title, message, [
      { text: stayText, style: 'cancel' },
      {
        text: exitText,
        style: 'destructive',
        onPress: async () => {
          if (onBeforeExit) await onBeforeExit()
          navigation.dispatch(data.action)
        },
      },
    ])
  })
}
