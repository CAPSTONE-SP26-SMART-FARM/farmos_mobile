import { useNavigation } from 'expo-router'
import { usePreventRemove, type NavigationAction } from '@react-navigation/native'
import { useConfirm } from '@/components/ui'

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
  const confirm = useConfirm()
  const {
    title = 'Bạn chưa lưu thay đổi',
    message = 'Thoát ra sẽ mất các thay đổi đang nhập. Bạn có muốn rời đi?',
    stayText = 'Tiếp tục',
    exitText = 'Không lưu',
    onBeforeExit,
  } = options ?? {}

  usePreventRemove(shouldPrevent, async ({ data }: { data: { action: NavigationAction } }) => {
    const choice = await confirm.show({
      title,
      message,
      icon: 'warning',
      actions: [
        { key: 'stay', label: stayText, variant: 'cancel' },
        { key: 'exit', label: exitText, variant: 'destructive' },
      ],
    })
    if (choice !== 'exit') return
    if (onBeforeExit) await onBeforeExit()
    navigation.dispatch(data.action)
  })
}
