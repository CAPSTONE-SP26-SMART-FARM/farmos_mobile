import { useState } from 'react'
import {
  View,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { Text } from './Text'
import { useConfirm } from './ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { uploadImageToCloudinary } from '@/utils/cloudinary'

interface AvatarPickerProps {
  uri: string | null
  name?: string | null
  size?: number
  fallbackSource?: ImageSourcePropType
  onUploaded: (url: string) => void | Promise<void>
  onRemoved?: () => void | Promise<void>
}

const COLORS = {
  primary: '#15803D',
  primaryBg: '#DCFCE7',
  overlay: 'rgba(0,0,0,0.35)',
  white: '#FFFFFF',
  initials: '#15803D',
  badgeIcon: '#374151',
}

function getInitials(name?: string | null): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1]?.[0] ?? ''
  const first = parts.length > 1 ? (parts[0]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export const AvatarPicker = ({
  uri,
  name,
  size = 96,
  fallbackSource,
  onUploaded,
  onRemoved,
}: AvatarPickerProps) => {
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [isUploading, setIsUploading] = useState(false)

  const pickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showToast.error({ message: 'Cần quyền truy cập thư viện ảnh' })
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || result.assets.length === 0) return

    setIsUploading(true)
    try {
      const url = await uploadImageToCloudinary(result.assets[0].uri)
      await onUploaded(url)
    } catch {
      showToast.error({ message: 'Cập nhật ảnh đại diện thất bại' })
    } finally {
      setIsUploading(false)
    }
  }

  const confirmRemove = async () => {
    if (!onRemoved) return
    const choice = await confirm.show({
      title: 'Xoá ảnh đại diện',
      message: 'Bạn có chắc muốn xoá ảnh đại diện?',
      actions: [
        { key: 'cancel', label: 'Huỷ', variant: 'cancel' },
        { key: 'delete', label: 'Xoá', variant: 'destructive' },
      ],
    })
    if (choice !== 'delete') return
    setIsUploading(true)
    try {
      await onRemoved()
    } catch {
      showToast.error({ message: 'Xoá ảnh đại diện thất bại' })
    } finally {
      setIsUploading(false)
    }
  }

  const initials = getInitials(name)
  const radius = size / 2

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={pickAndUpload}
        disabled={isUploading}
        style={[styles.avatar, { width: size, height: size, borderRadius: radius }]}
      >
        {uri ? (
          <Image source={{ uri }} style={[styles.image, { borderRadius: radius }]} />
        ) : fallbackSource ? (
          <Image source={fallbackSource} style={[styles.image, { borderRadius: radius }]} />
        ) : (
          <View style={[styles.placeholder, { borderRadius: radius }]}>
            {initials ? (
              <Text style={styles.initials}>{initials}</Text>
            ) : (
              <Ionicons name='person' size={size * 0.5} color={COLORS.primary} />
            )}
          </View>
        )}

        {isUploading && (
          <View style={[styles.overlay, { borderRadius: radius }]}>
            <ActivityIndicator color={COLORS.white} />
          </View>
        )}

        <View style={styles.badge}>
          <Ionicons name='camera' size={22} color={COLORS.badgeIcon} />
        </View>
      </TouchableOpacity>

      {uri && onRemoved && !isUploading && (
        <TouchableOpacity onPress={confirmRemove} hitSlop={8} style={styles.removeBtn}>
          <Text style={styles.removeText}>Xoá ảnh</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  avatar: { position: 'relative', backgroundColor: COLORS.primaryBg },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBg,
  },
  initials: { fontSize: 28, fontFamily: 'Inter_700Bold', color: COLORS.initials },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 13, color: '#DC2828', fontFamily: 'Inter_500Medium' },
  removeBtn: { paddingVertical: 2 },
})
