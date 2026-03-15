import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  TextInput,
  StyleProp,
  ViewStyle,
  ModalProps,
  FlatList,
  FlatListProps,
  Pressable
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import Ionicons from '@expo/vector-icons/Ionicons'

interface BottomSheetProps extends ModalProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
}

export const BottomSheet = ({
  visible,
  onClose,
  children,
  containerStyle,
  ...props
}: BottomSheetProps) => {
  const [showModal, setShowModal] = React.useState(visible)
  const translateY = useSharedValue(1000)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY
        scale.value = 1 - Math.min(event.translationY / 2000, 0.1)
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        onClose()
      } else {
        translateY.value = withSpring(0, { mass: 0.5, damping: 20, stiffness: 100 })
        scale.value = withSpring(1, { mass: 0.5, damping: 20, stiffness: 100 })
      }
    })
    .runOnJS(true)

  React.useEffect(() => {
    if (visible) {
      setShowModal(true)
      opacity.value = withTiming(1, { duration: 400 })
      translateY.value = withSpring(0, { mass: 0.5, damping: 20, stiffness: 100 })
      scale.value = withSpring(1, { mass: 0.5, damping: 20, stiffness: 100 })
    } else {
      opacity.value = withTiming(0, { duration: 250 })
      scale.value = withTiming(0.9, { duration: 250 })
      translateY.value = withSpring(1000, { mass: 0.5, damping: 24, stiffness: 120 })
      setShowModal(false)
    }
  }, [visible])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }]
  }))

  if (!showModal) return null

  return (
    <Modal
      visible={showModal}
      transparent
      animationType='none'
      onRequestClose={onClose}
      {...props}
    >
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <View style={styles.sheetWrapper} pointerEvents='box-none'>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.bottomSheet, containerStyle, sheetStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  )
}

BottomSheet.Header = ({
  title,
  onClose,
  showBackButton = false
}: {
  title: string
  onClose: () => void
  showBackButton?: boolean
}) => (
  <View style={styles.header}>
    {showBackButton ? (
      <>
        <TouchableOpacity style={styles.backButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name='arrow-back' size={24} color='#111827' />
        </TouchableOpacity>
        <Text style={styles.titleCenter}>{title}</Text>
        <View style={styles.headerSpacer} />
      </>
    ) : (
      <>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name='close' size={20} color='#4B5563' />
        </TouchableOpacity>
      </>
    )}
  </View>
)

BottomSheet.Search = ({
  placeholder,
  value,
  onChangeText
}: {
  placeholder: string
  value: string
  onChangeText: (t: string) => void
}) => (
  <View style={styles.searchContainer}>
    <Ionicons name='search' size={20} color='#6B7280' />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      placeholderTextColor='#9CA3AF'
      value={value}
      onChangeText={onChangeText}
    />
  </View>
)

BottomSheet.ScrollView = ({
  children,
  style
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) => (
  <ScrollView style={[styles.scrollView, style]} showsVerticalScrollIndicator={false} bounces={false}>
    {children}
  </ScrollView>
)

BottomSheet.Content = ({
  children,
  style
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) => <View style={[styles.content, style]}>{children}</View>

BottomSheet.SelectOption = <T extends any>({
  data,
  keyExtractor,
  labelExtractor,
  subtitleExtractor,
  valueExtractor,
  selectedValue,
  renderLabel,
  onSelect
}: {
  data: T[]
  keyExtractor: (item: T) => string
  labelExtractor: (item: T) => string
  subtitleExtractor?: (item: T) => string | undefined
  valueExtractor: (item: T) => string | number | undefined
  selectedValue?: string | number
  renderLabel?: (item: T) => React.ReactNode
  onSelect: (item: T) => void
}) => (
  <View style={styles.content}>
    {data.map((item, index) => (
      <BottomSheet.SelectItem
        key={keyExtractor(item)}
        label={labelExtractor(item)}
        subtitle={subtitleExtractor?.(item)}
        isSelected={selectedValue === valueExtractor(item)}
        isLast={index === data.length - 1}
        onPress={() => onSelect(item)}
        renderLabel={renderLabel ? () => renderLabel(item) : undefined}
      />
    ))}
  </View>
)

BottomSheet.SelectItem = ({
  label,
  subtitle,
  isSelected,
  onPress,
  isLast = false,
  renderLabel
}: {
  label: string
  subtitle?: string
  isSelected?: boolean
  onPress?: () => void
  isLast?: boolean
  renderLabel?: () => React.ReactNode
}) => (
  <TouchableOpacity
    style={[styles.option, isLast && styles.optionLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.optionContent}>
      {renderLabel ? renderLabel() : <Text style={styles.optionLabel}>{label}</Text>}
      {subtitle && !renderLabel && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
    {isSelected && <Ionicons name='checkmark' size={20} color='#2463EB' />}
  </TouchableOpacity>
)

BottomSheet.RadioOption = <T extends any>({
  data,
  keyExtractor,
  labelExtractor,
  valueExtractor,
  selectedValue,
  onSelect,
  renderLabel,
  style,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: Omit<FlatListProps<T>, 'renderItem'> & {
  labelExtractor: (item: T) => string
  renderLabel?: (item: T) => React.ReactNode
  valueExtractor: (item: T) => string | number
  selectedValue?: string | number
  onSelect: (item: T) => void
}) => {
  const renderItem = React.useCallback(
    ({ item }: { item: T }) => (
      <BottomSheet.RadioItem
        label={labelExtractor(item)}
        isSelected={selectedValue === valueExtractor(item)}
        onPress={() => onSelect(item)}
        renderLabel={renderLabel ? () => renderLabel(item) : undefined}
      />
    ),
    [labelExtractor, selectedValue, valueExtractor, onSelect, renderLabel]
  )

  return (
    <FlatList<T>
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      style={[styles.radioList, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      bounces={false}
      {...props}
    />
  )
}

BottomSheet.RadioItem = React.memo(
  ({
    label,
    isSelected,
    onPress,
    renderLabel
  }: {
    label: string
    isSelected?: boolean
    onPress?: () => void
    renderLabel?: () => React.ReactNode
  }) => (
    <Pressable style={styles.radioOptionRow} onPress={onPress}>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
      {renderLabel ? renderLabel() : <Text style={styles.radioOptionText}>{label}</Text>}
    </Pressable>
  )
)

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  sheetWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end'
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 24,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  title: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  titleCenter: { fontSize: 18, fontWeight: '600', color: '#111827' },
  backButton: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  headerSpacer: { width: 24 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },
  scrollView: { flexGrow: 0 },
  content: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  optionLast: { borderBottomWidth: 0 },
  optionContent: { flex: 1, marginRight: 12 },
  optionLabel: { fontSize: 16, color: '#1F2937', lineHeight: 24 },
  optionSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  radioList: { paddingHorizontal: 5 },
  radioOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioOuterSelected: { borderColor: '#2463EB' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2463EB' },
  radioOptionText: { fontSize: 16, color: '#111827', flex: 1 }
})
