import { useMemo, useState } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, TouchableOpacity, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { Text, TextField, SelectField, PrimaryButton, TopBar } from '@/components/ui'
import { useCreateIncident, useMyMilestones } from '@/hooks/useIncident'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { uploadImageToCloudinary } from '@/utils/cloudinary'
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
  const { showToast } = useToast()
  const { mutate, isPending } = useCreateIncident()
  const { data: milestones = [], isLoading: isLoadingMilestones } = useMyMilestones()

  const [milestone, setMilestone] = useState<FarmerMyMilestone | null>(null)
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const milestoneOptions = useMemo(
    () => milestones.map((m) => ({ ...m, label: m.stageName, subtitle: m.zoneName })),
    [milestones],
  )

  const canSubmit = !!milestone && title.trim().length > 0 && description.trim().length > 0

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
        title: title.trim(),
        description: description.trim(),
        severity,
        attachments,
      },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã gửi báo cáo sự cố' })
          router.back()
        },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Gửi báo cáo thất bại') }),
      },
    )
  }

  const isLoading = isPending || isUploading

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <TopBar title='Báo cáo sự cố' />

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

        <View style={styles.footer}>
          <PrimaryButton
            title='Hoàn thành'
            loading={isLoading}
            disabled={!canSubmit || isLoading}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
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

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
})
