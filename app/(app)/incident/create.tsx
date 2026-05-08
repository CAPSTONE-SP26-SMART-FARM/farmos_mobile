import { useMemo, useRef, useState, useEffect } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, TouchableOpacity, Image, Animated as RNAnimated,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Stack, useRouter } from 'expo-router'
import { Text, TextField, SelectField } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useCreateIncident, useMyMilestones, useTicketBalance } from '@/hooks/useIncident'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import type { TicketCategory } from '@/types/ticketCategory'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { uploadImageToCloudinary } from '@/utils/cloudinary'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import { SEVERITY_META } from '@/constants/incident'
import { icons } from '@/constants/icon'
import type { IncidentSeverity } from '@/types/incident'
import type { FarmerMyMilestone } from '@/types/production'

const CloseIcon = icons.closeSvg
const PlusIcon = icons.plusSvg

const SEVERITY_OPTIONS = (Object.keys(SEVERITY_META) as IncidentSeverity[]).map((value) => ({
  value,
  label: SEVERITY_META[value].label,
  desc: SEVERITY_META[value].desc,
  color: SEVERITY_META[value].color,
}))

const MAX_IMAGES = 3

export default function CreateIncidentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { showToast } = useToast()
  const { mutate, isPending } = useCreateIncident()
  const { data: milestones = [], isLoading: isLoadingMilestones } = useMyMilestones()

  const { data: categories = [], isLoading: isLoadingCategories } = useActiveTicketCategories()
  const { data: balanceRaw } = useTicketBalance()
  const balanceItems = Array.isArray(balanceRaw) ? balanceRaw : []
  const [milestone, setMilestone] = useState<FarmerMyMilestone | null>(null)
  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const errorOpacity = useRef(new RNAnimated.Value(0)).current
  const justSavedRef = useRef(false)

  useEffect(() => {
    if (!inlineError) return
    RNAnimated.timing(errorOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    const t = setTimeout(() => {
      RNAnimated.timing(errorOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
        () => setInlineError(null)
      )
    }, 3500)
    return () => clearTimeout(t)
  }, [inlineError])

  const balanceMap = useMemo(
    () => Object.fromEntries(balanceItems.map((b) => [b.categoryConfigId, b.total])),
    [balanceItems],
  )

  const categoryOptions = useMemo(
    () => categories.map((c) => ({
      ...c,
      label: c.name,
      subtitle: `${(c.unitPrice / 1000).toFixed(0)}k / lần`,
      noQuota: balanceItems.length > 0 && (balanceMap[c.id] ?? -1) === 0,
    })),
    [categories, balanceItems, balanceMap],
  )

  const milestoneOptions = useMemo(
    () => milestones
      .filter((m) => m.status === 'in_progress')
      .map((m) => ({ ...m, label: m.stageName, subtitle: m.zoneName })),
    [milestones],
  )

  const canSubmit = !!milestone && !!category && title.trim().length > 0 && description.trim().length > 0

  const handlePickImage = async () => {
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
      setImageUris((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES))
    }
  }

  const handleRemoveImage = (uri: string) => {
    setImageUris((prev) => prev.filter((u) => u !== uri))
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    let attachments: { url: string }[] | undefined

    if (imageUris.length > 0) {
      setIsUploading(true)
      try {
        const urls = await Promise.all(imageUris.map(uploadImageToCloudinary))
        attachments = urls.map((url) => ({ url }))
      } catch {
        showToast.error({ message: 'Upload ảnh thất bại, vui lòng thử lại' })
        return
      } finally {
        setIsUploading(false)
      }
    }

    mutate(
      {
        milestoneId: milestone!.id,
        categoryConfigId: category!.id,
        title: title.trim(),
        description: description.trim(),
        severity,
        attachments,
      },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã gửi báo cáo sự cố' })
          justSavedRef.current = true
          router.back()
        },
        onError: (err) => setInlineError(getErrorMessage(err, 'Gửi báo cáo thất bại')),
      },
    )
  }

  const isLoading = isPending || isUploading

  const isDirty =
    !!milestone || !!category || title.length > 0 || description.length > 0 || imageUris.length > 0
  usePreventUnsavedChanges(isDirty && !justSavedRef.current && !isLoading, {
    message: 'Bạn đang nhập báo cáo sự cố. Thoát ra sẽ mất các thay đổi.',
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.flex}>
        <SheetHeader
        title='Báo cáo sự cố'
        onCancel={() => router.back()}
        onDone={handleSubmit}
        doneLabel={isLoading ? 'Đang gửi…' : 'Hoàn thành'}
        canDone={canSubmit && !isLoading}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin sự cố</Text>

              <View style={styles.fields}>
                <SelectField
                  label='Loại sự cố'
                  value={category ? `${category.name} · ${(category.unitPrice / 1000).toFixed(0)}k` : ''}
                  options={categoryOptions}
                  bottomSheetTitle='Chọn loại sự cố'
                  disabled={isLoadingCategories}
                  labelExtractor={(item) => item.name}
                  subtitleExtractor={(item) => item.subtitle ?? ''}
                  valueExtractor={(item) => item.id}
                  selectedValue={category?.id ?? null}
                  onSelect={(item) => setCategory(item)}
                  showError={false}
                  disabledExtractor={(item) => item.noQuota === true}
                  renderLabel={(item) => (
                    <View style={styles.categoryLabelRow}>
                      <Text style={styles.categoryLabelText}>{item.name}</Text>
                      {item.noQuota && (
                        <View style={styles.noQuotaBadge}>
                          <Text style={styles.noQuotaBadgeText}>Hết quota</Text>
                        </View>
                      )}
                    </View>
                  )}
                />

                <SelectField
                  label='Milestone'
                  value={milestone ? `${milestone.stageName} · ${milestone.zoneName}` : ''}
                  options={milestoneOptions}
                  bottomSheetTitle='Chọn milestone'
                  disabled={isLoadingMilestones}
                  labelExtractor={(item) => item.stageName}
                  subtitleExtractor={(item) => item.zoneName}
                  valueExtractor={(item) => item.id}
                  selectedValue={milestone?.id ?? null}
                  onSelect={(item) => setMilestone(item)}
                  showError={false}
                />

                <TextField
                  label='Tiêu đề'
                  value={title}
                  onChangeText={setTitle}
                  autoCapitalize='sentences'
                  showError={false}
                />

                <SelectField
                  label='Mức độ nghiêm trọng'
                  value={SEVERITY_META[severity].label}
                  options={SEVERITY_OPTIONS}
                  bottomSheetTitle='Chọn mức độ nghiêm trọng'
                  labelExtractor={(item) => item.label}
                  subtitleExtractor={(item) => item.desc}
                  valueExtractor={(item) => item.value}
                  selectedValue={severity}
                  onSelect={(item) => setSeverity(item.value)}
                  showError={false}
                />

                <TextField
                  label='Mô tả chi tiết'
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  inputStyle={styles.textarea}
                  showError={false}
                />

                <View style={styles.imageSection}>
                  <Text style={styles.imageLabel}>Ảnh đính kèm (tuỳ chọn)</Text>
                  <View style={styles.imageRow}>
                    {imageUris.map((uri) => (
                      <View key={uri} style={styles.thumb}>
                        <Image source={{ uri }} style={styles.thumbImg} />
                        <TouchableOpacity
                          style={styles.thumbRemove}
                          onPress={() => handleRemoveImage(uri)}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <CloseIcon width={10} height={10} color='#fff' />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {imageUris.length < MAX_IMAGES && (
                      <TouchableOpacity style={styles.addBtn} onPress={handlePickImage} activeOpacity={0.7}>
                        <PlusIcon width={20} height={20} color='#9CA3AF' />
                        <Text style={styles.addBtnText}>Thêm ảnh</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      </SafeAreaView>


      {inlineError && (
        <RNAnimated.View style={[styles.inlineToast, { bottom: insets.bottom + 12, opacity: errorOpacity }]}>
          <Text style={styles.inlineToastText}>{inlineError}</Text>
        </RNAnimated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  fields: { gap: 12 },
  textarea: { minHeight: 120 },

  imageSection: { gap: 8 },
  imageLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

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

  categoryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  categoryLabelText: { fontSize: 15, color: '#111827', fontFamily: 'Inter_400Regular', flex: 1 },
  noQuotaBadge: { backgroundColor: '#FEF2F2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  noQuotaBadgeText: { fontSize: 11, color: '#DC2626', fontFamily: 'Inter_500Medium' },

  inlineToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  inlineToastText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 },
})
