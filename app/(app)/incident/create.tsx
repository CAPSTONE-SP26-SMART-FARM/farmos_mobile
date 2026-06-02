import { useMemo, useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, TouchableOpacity, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Stack, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TextField, SelectField } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useCreateIncident, useMyMilestones, useTicketBalance } from '@/hooks/useIncident'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import type { TicketCategory } from '@/types/ticketCategory'
import { useToast } from '@/hooks/useToast'
import { extractApiError, getErrorMessage } from '@/utils/error'
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

// Map field paths backend có thể trả về → input mặc định ở form.
type FieldErrors = {
  categoryConfigId?: string
  milestoneId?: string
  title?: string
  description?: string
  severity?: string
  attachments?: string
}

export default function CreateIncidentScreen() {
  const router = useRouter()
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const justSavedRef = useRef(false)

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

  const canSubmit =
    !!milestone && !!category && title.trim().length > 0 && description.trim().length > 0

  const resetErrors = () => {
    setFieldErrors({})
    setServerError(null)
  }

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

  const validateLocal = (): boolean => {
    const next: FieldErrors = {}
    if (!category) next.categoryConfigId = 'Vui lòng chọn loại sự cố'
    if (!milestone) next.milestoneId = 'Vui lòng chọn giai đoạn canh tác'
    if (title.trim().length === 0) next.title = 'Vui lòng nhập tiêu đề ngắn gọn cho sự cố'
    else if (title.trim().length < 6) next.title = 'Tiêu đề quá ngắn, hãy mô tả rõ hơn (≥ 6 ký tự)'
    if (description.trim().length === 0) {
      next.description = 'Vui lòng mô tả chi tiết để bác sĩ hiểu tình trạng'
    } else if (description.trim().length < 10) {
      next.description = 'Mô tả quá ngắn, vui lòng cung cấp thêm chi tiết (≥ 10 ký tự)'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    resetErrors()
    if (!validateLocal()) return

    let attachments: { url: string }[] | undefined

    if (imageUris.length > 0) {
      setIsUploading(true)
      try {
        const urls = await Promise.all(imageUris.map(uploadImageToCloudinary))
        attachments = urls.map((url) => ({ url }))
      } catch {
        const msg = 'Upload ảnh thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.'
        setServerError(msg)
        showToast.error({ message: msg })
        setIsUploading(false)
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
          justSavedRef.current = true
          showToast.success({ message: 'Đã gửi báo cáo sự cố thành công' })
          router.back()
        },
        onError: (err) => {
          const ex = extractApiError(err)

          // Map field-level errors về đúng input nếu BE có trả.
          const KNOWN_PATHS = [
            'categoryConfigId', 'milestoneId', 'title', 'description', 'severity', 'attachments',
          ] as const
          const nextField: FieldErrors = {}
          for (const [path, message] of Object.entries(ex.fieldErrors)) {
            if ((KNOWN_PATHS as readonly string[]).includes(path)) {
              nextField[path as keyof FieldErrors] = message
            }
          }
          setFieldErrors(nextField)

          // Top-level banner — ưu tiên network, sau đó message của BE, fallback message thân thiện.
          const banner = ex.isNetworkError
            ? 'Mất kết nối mạng. Vui lòng thử lại.'
            : getErrorMessage(err, 'Gửi báo cáo thất bại. Vui lòng thử lại.')
          setServerError(banner)
          showToast.error({ message: banner })
        },
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
          doneLabel={isUploading ? 'Đang tải ảnh…' : isPending ? 'Đang gửi…' : 'Hoàn thành'}
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
              {serverError ? (
                <View style={styles.errorBanner}>
                  <MaterialIcons name='error-outline' size={18} color='#B91C1C' />
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Thông tin sự cố</Text>

                <View style={styles.fields}>
                  {/* Loại sự cố */}
                  <View>
                    <SelectField
                      label='Loại sự cố *'
                      value={category ? category.name : ''}
                      options={categoryOptions}
                      bottomSheetTitle='Chọn loại sự cố'
                      disabled={isLoadingCategories}
                      labelExtractor={(item) => item.name}
                      subtitleExtractor={(item) => item.subtitle ?? ''}
                      valueExtractor={(item) => item.id}
                      selectedValue={category?.id ?? null}
                      onSelect={(item) => {
                        setCategory(item)
                        if (fieldErrors.categoryConfigId) {
                          setFieldErrors((p) => ({ ...p, categoryConfigId: undefined }))
                        }
                        if (serverError) setServerError(null)
                      }}
                      error={fieldErrors.categoryConfigId}
                      showError={!!fieldErrors.categoryConfigId}
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
                    {!fieldErrors.categoryConfigId && (
                      <Text style={styles.hint}>
                        Ví dụ: Sâu bệnh, Dịch hại, Thiết bị hỏng…
                      </Text>
                    )}
                  </View>

                  {/* Giai đoạn (trước đây là Milestone) */}
                  <View>
                    <SelectField
                      label='Giai đoạn *'
                      value={milestone ? `${milestone.stageName} · ${milestone.zoneName}` : ''}
                      options={milestoneOptions}
                      bottomSheetTitle='Chọn giai đoạn'
                      disabled={isLoadingMilestones}
                      labelExtractor={(item) => item.stageName}
                      subtitleExtractor={(item) => item.zoneName}
                      valueExtractor={(item) => item.id}
                      selectedValue={milestone?.id ?? null}
                      onSelect={(item) => {
                        setMilestone(item)
                        if (fieldErrors.milestoneId) {
                          setFieldErrors((p) => ({ ...p, milestoneId: undefined }))
                        }
                        if (serverError) setServerError(null)
                      }}
                      error={fieldErrors.milestoneId}
                      showError={!!fieldErrors.milestoneId}
                    />
                    {!fieldErrors.milestoneId && (
                      <Text style={styles.hint}>
                        Chọn giai đoạn canh tác đang gặp sự cố (chỉ giai đoạn đang diễn ra).
                      </Text>
                    )}
                  </View>

                  {/* Tiêu đề */}
                  <View>
                    <TextField
                      label='Tiêu đề *'
                      value={title}
                      onChangeText={(v) => {
                        setTitle(v)
                        if (fieldErrors.title) {
                          setFieldErrors((p) => ({ ...p, title: undefined }))
                        }
                        if (serverError) setServerError(null)
                      }}
                      autoCapitalize='sentences'
                      error={fieldErrors.title}
                      showError={!!fieldErrors.title}
                      maxLength={120}
                    />
                    {!fieldErrors.title && (
                      <Text style={styles.hint}>
                        Ví dụ: "Lúa bị úa vàng ở khu A" — ngắn gọn, nêu rõ vấn đề.
                      </Text>
                    )}
                  </View>

                  {/* Mức độ */}
                  <View>
                    <SelectField
                      label='Mức độ nghiêm trọng *'
                      value={SEVERITY_META[severity].label}
                      options={SEVERITY_OPTIONS}
                      bottomSheetTitle='Chọn mức độ nghiêm trọng'
                      labelExtractor={(item) => item.label}
                      subtitleExtractor={(item) => item.desc}
                      valueExtractor={(item) => item.value}
                      selectedValue={severity}
                      onSelect={(item) => setSeverity(item.value)}
                      error={fieldErrors.severity}
                      showError={!!fieldErrors.severity}
                    />
                    {!fieldErrors.severity && (
                      <Text style={styles.hint}>
                        Mức độ ảnh hưởng đến mức ưu tiên xử lý của bác sĩ.
                      </Text>
                    )}
                  </View>

                  {/* Mô tả */}
                  <View>
                    <TextField
                      label='Mô tả chi tiết *'
                      value={description}
                      onChangeText={(v) => {
                        setDescription(v)
                        if (fieldErrors.description) {
                          setFieldErrors((p) => ({ ...p, description: undefined }))
                        }
                        if (serverError) setServerError(null)
                      }}
                      multiline
                      numberOfLines={5}
                      inputStyle={styles.textarea}
                      error={fieldErrors.description}
                      showError={!!fieldErrors.description}
                    />
                    {!fieldErrors.description && (
                      <Text style={styles.hint}>
                        Ví dụ: "Lá bị vàng từ 2 ngày trước, lan rộng trên khoảng 30% diện tích.
                        Đất ẩm, đã tưới đều."
                      </Text>
                    )}
                  </View>

                  {/* Ảnh đính kèm */}
                  <View style={styles.imageSection}>
                    <Text style={styles.imageLabel}>Ảnh đính kèm (tuỳ chọn)</Text>
                    <Text style={styles.hint}>
                      Đính kèm tối đa {MAX_IMAGES} ảnh rõ nét để bác sĩ chẩn đoán nhanh hơn.
                    </Text>
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
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={handlePickImage}
                          activeOpacity={0.7}
                        >
                          <PlusIcon width={20} height={20} color='#15803D' />
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 12 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#B91C1C',
    fontFamily: 'Inter_500Medium',
  },

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

  hint: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },

  imageSection: { gap: 6 },
  imageLabel: { fontSize: 13, color: '#374151', fontFamily: 'Inter_500Medium' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },

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
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
  },
  addBtnText: { fontSize: 11, color: '#15803D', fontFamily: 'Inter_500Medium' },

  categoryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  categoryLabelText: { fontSize: 15, color: '#111827', fontFamily: 'Inter_400Regular', flex: 1 },
  noQuotaBadge: { backgroundColor: '#FEF2F2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  noQuotaBadgeText: { fontSize: 11, color: '#DC2626', fontFamily: 'Inter_500Medium' },
})
