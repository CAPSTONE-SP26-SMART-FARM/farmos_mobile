import { View, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from './Text'
import { icons } from '@/constants/icon'

const CloseIcon = icons.closeSvg
const PlusIcon = icons.plusSvg

interface Props {
  label?: string
  imageUris: string[]
  canAdd: boolean
  onPick: () => void
  onRemove: (uri: string) => void
}

/**
 * Grid hiển thị ảnh đã chọn + nút "Thêm ảnh" dạng dashed.
 * Dùng kèm `useImagePicker`.
 */
export function ImagePickerGrid({ label, imageUris, canAdd, onPick, onRemove }: Props) {
  return (
    <View style={styles.section}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {imageUris.map((uri) => (
          <View key={uri} style={styles.thumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity
              style={styles.thumbRemove}
              onPress={() => onRemove(uri)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <CloseIcon width={10} height={10} color='#fff' />
            </TouchableOpacity>
          </View>
        ))}

        {canAdd && (
          <TouchableOpacity style={styles.addBtn} onPress={onPick} activeOpacity={0.7}>
            <PlusIcon width={20} height={20} color='#9CA3AF' />
            <Text style={styles.addBtnText}>Thêm ảnh</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  label: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: { width: 80, height: 80, borderRadius: 10, overflow: 'visible' },
  thumbImg: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F3F4F6' },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
  },
  addBtnText: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
