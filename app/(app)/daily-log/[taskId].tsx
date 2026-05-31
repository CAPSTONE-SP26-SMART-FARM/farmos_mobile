import { useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Text, TextField, ImagePickerGrid } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useSubmitDailyLog } from '@/hooks/useDailyLog'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import { useImagePicker } from '@/hooks/useImagePicker'
import { uploadImageToCloudinary } from '@/utils/cloudinary'
import { icons } from '@/constants/icon'

const DiaryIcon = icons.diarySvg
const MAX_IMAGES = 5

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}
const PRIORITY_COLOR: Record<string, string> = {
  low: '#6B7280',
  normal: '#2463EB',
  high: '#D97706',
  urgent: '#DC2626',
}

export default function DailyLogSubmitScreen() {
  const router = useRouter()
  const { taskId, title, priority, progress } = useLocalSearchParams<{
    taskId: string
    title: string
    priority: string
    progress?: string
  }>()
  const progressValue = Math.max(0, Math.min(100, Math.round(Number(progress ?? 0))))
  const progressColor = progressValue >= 100 ? '#16A34A' : '#2463EB'
  const { showToast } = useToast()
  const { mutate, isPending } = useSubmitDailyLog()
  const justSavedRef = useRef(false)

  const [activities, setActivities] = useState('')
  const [notes, setNotes] = useState('')
  const [activitiesError, setActivitiesError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { imageUris, pick, remove, canAdd } = useImagePicker({ max: MAX_IMAGES })

  const canSubmit = activities.trim().length > 0
  const isLoading = isPending || isUploading

  const handleSubmit = async () => {
    if (!canSubmit) {
      setActivitiesError('Vui lòng mô tả công việc đã làm hôm nay')
      return
    }
    setActivitiesError('')

    let attachments: { url: string }[] | undefined
    if (imageUris.length > 0) {
      setIsUploading(true)
      try {
        const urls = await Promise.all(imageUris.map(uploadImageToCloudinary))
        attachments = urls.map((url) => ({ url }))
      } catch {
        showToast.error({ message: 'Upload ảnh thất bại, vui lòng thử lại' })
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    mutate(
      { employeeTaskId: taskId, activities: activities.trim(), notes: notes.trim(), attachments },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã ghi nhật ký thành công' })
          justSavedRef.current = true
          router.back()
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            showToast.error({ message: 'Bạn đã ghi nhật ký cho công việc này hôm nay rồi' })
          } else {
            showToast.error({ message: err?.response?.data?.message ?? 'Ghi nhật ký thất bại' })
          }
        },
      },
    )
  }

  const isDirty = activities.length > 0 || notes.length > 0 || imageUris.length > 0
  usePreventUnsavedChanges(isDirty && !justSavedRef.current && !isLoading, {
    message: 'Bạn đang ghi nhật ký. Thoát ra sẽ mất các thay đổi.',
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.flex}>
        <SheetHeader
          title='Ghi nhật ký'
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
              <View style={styles.taskCard}>
                <View style={styles.taskIconWrap}>
                  <DiaryIcon width={24} height={24} color='#2463EB' />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle} numberOfLines={2}>{title}</Text>
                  <Text style={[styles.taskPriority, { color: PRIORITY_COLOR[priority] ?? '#2463EB' }]}>
                    {PRIORITY_LABEL[priority] ?? priority}
                  </Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progressValue}%`, backgroundColor: progressColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: progressColor }]}>
                      {progressValue}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.dateChip}>
                <Text style={styles.dateChipText}>
                  {new Date().toLocaleDateString('vi-VN', {
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.card}>
                <TextField
                  label='Đã làm gì hôm nay *'
                  value={activities}
                  onChangeText={(v) => {
                    setActivities(v)
                    if (v.trim()) setActivitiesError('')
                  }}
                  multiline
                  numberOfLines={5}
                  error={activitiesError}
                  showClear={false}
                  containerStyle={styles.textareaContainer}
                />

                <TextField
                  label='Ghi chú thêm (tuỳ chọn)'
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  showClear={false}
                  containerStyle={styles.textareaContainer}
                />

                <ImagePickerGrid
                  label='Ảnh đính kèm (tuỳ chọn)'
                  imageUris={imageUris}
                  canAdd={canAdd}
                  onPick={pick}
                  onRemove={remove}
                />
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
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },

  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  taskIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#111827', lineHeight: 22 },
  taskPriority: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_600SemiBold',
    minWidth: 34,
    textAlign: 'right',
  },

  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dateChipText: { fontSize: 13, color: '#2463EB', fontFamily: 'Inter_500Medium' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  textareaContainer: { minHeight: 100 },
})
