import { useCallback } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'

interface Options {
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
  onConfirm?: () => void
}

export const useUnsavedChangesAlert = (isDirty: boolean, options?: Options) => {
  const {
    title = 'Thay đổi chưa được lưu',
    message = 'Bạn có muốn thoát mà không lưu lại các thay đổi?',
    cancelText = 'Hủy',
    confirmText = 'Đồng ý',
    onConfirm,
  } = options || {}

  const handleClose = useCallback(() => {
    if (!isDirty) {
      onConfirm ? onConfirm() : router.back()
      return
    }
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      {
        text: confirmText,
        style: 'destructive',
        onPress: () => (onConfirm ? onConfirm() : router.back()),
      },
    ])
  }, [isDirty, title, message, cancelText, confirmText, onConfirm])

  return { handleClose }
}
