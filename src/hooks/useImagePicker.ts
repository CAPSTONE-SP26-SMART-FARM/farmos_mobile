import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { useToast } from '@/hooks/useToast'

interface UseImagePickerOptions {
  max: number
}

/**
 * Quản lý state ảnh đã chọn + flow pick từ thư viện. Dùng chung cho mọi
 * form có upload ảnh (incident create, daily log submit, ...).
 */
export function useImagePicker({ max }: UseImagePickerOptions) {
  const { showToast } = useToast()
  const [imageUris, setImageUris] = useState<string[]>([])

  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showToast.error({ message: 'Cần quyền truy cập thư viện ảnh' })
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsMultipleSelection: true,
    })
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri)
      setImageUris((prev) => [...prev, ...newUris].slice(0, max))
    }
  }

  const remove = (uri: string) => {
    setImageUris((prev) => prev.filter((u) => u !== uri))
  }

  const reset = () => setImageUris([])

  return { imageUris, pick, remove, reset, canAdd: imageUris.length < max }
}
