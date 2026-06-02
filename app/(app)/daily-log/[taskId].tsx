import { useEffect, useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TextField, ImagePickerGrid } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { WindowBanner } from '@/components/features/dailyLog/WindowBanner'
import { useSubmitDailyLog } from '@/hooks/useDailyLog'
import { extractApiError, getDailyLogErrorMessage } from '@/utils/error'
import { isWithinDailyLogWindow } from '@/utils/dailyLogWindow'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import { useImagePicker } from '@/hooks/useImagePicker'
import { uploadImageToCloudinary } from '@/utils/cloudinary'

const MAX_IMAGES = 5

export default function DailyLogSubmitScreen() {
  const router = useRouter()
  const { taskId } = useLocalSearchParams<{ taskId: string }>()

  const { showToast } = useToast()
  const { mutate, isPending } = useSubmitDailyLog()
  const justSavedRef = useRef(false)

  const [activities, setActivities] = useState('')
  const [notes, setNotes] = useState('')
  const [activitiesError, setActivitiesError] = useState('')
  const [notesError, setNotesError] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const { imageUris, pick, remove, canAdd, reset: resetImages } = useImagePicker({ max: MAX_IMAGES })

  const [inWindow, setInWindow] = useState(isWithinDailyLogWindow())
  useEffect(() => {
    const id = setInterval(() => setInWindow(isWithinDailyLogWindow()), 60_000)
    return () => clearInterval(id)
  }, [])

  const canSubmit = activities.trim().length > 0 && inWindow
  const isLoading = isPending || isUploading

  const clearForm = () => {
    setActivities('')
    setNotes('')
    setActivitiesError('')
    setNotesError('')
    resetImages()
  }

  const resetErrors = () => {
    setActivitiesError('')
    setNotesError('')
    setServerError(null)
  }

  const handleSubmit = async () => {
    if (!inWindow) {
      const msg = 'Ngoài khung giờ làm việc. Chỉ tạo nhật ký trong 07:00–17:00.'
      setServerError(msg)
      showToast.error({ message: msg })
      return
    }
    if (!activities.trim()) {
      setActivitiesError('Vui lòng mô tả công việc đã làm hôm nay')
      return
    }
    resetErrors()

    let attachments: { url: string }[] | undefined
    if (imageUris.length > 0) {
      setIsUploading(true)
      try {
        const urls = await Promise.all(imageUris.map(uploadImageToCloudinary))
        attachments = urls.map((url) => ({ url }))
      } catch {
        setServerError('Upload ảnh thất bại. Vui lòng kiểm tra mạng và thử lại.')
        showToast.error({ message: 'Upload ảnh thất bại' })
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
          justSavedRef.current = true
          clearForm()
          setSuccessCount((n) => n + 1)
          showToast.success({ message: 'Đã ghi nhật ký thành công' })
          // Reset flag sau khi state đã apply để usePreventUnsavedChanges thấy form sạch.
          setTimeout(() => { justSavedRef.current = false }, 50)
        },
        onError: (err) => {
          const ex = extractApiError(err)

          // Map field errors về đúng input
          if (ex.fieldErrors.activities) {
            setActivitiesError(ex.fieldErrors.activities)
          }
          if (ex.fieldErrors.notes) {
            setNotesError(ex.fieldErrors.notes)
          }

          // Top-level message — ưu tiên copy thân thiện cho các error code đã biết
          const friendly = getDailyLogErrorMessage(err)
          let banner: string
          if (friendly) {
            banner = friendly
          } else if (ex.statusCode === 409) {
            banner = 'Bạn đã ghi nhật ký cho công việc này hôm nay rồi.'
          } else if (ex.isNetworkError) {
            banner = 'Mất kết nối mạng. Vui lòng thử lại.'
          } else {
            banner =
              ex.message ??
              Object.values(ex.fieldErrors)[0] ??
              'Ghi nhật ký thất bại. Vui lòng thử lại.'
          }
          setServerError(banner)
          showToast.error({ message: banner })
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
          title='Tạo nhật ký'
          onCancel={() => router.back()}
          onDone={handleSubmit}
          doneLabel={
            isUploading
              ? 'Đang tải ảnh…'
              : isPending
                ? 'Đang gửi…'
                : !inWindow
                  ? 'Ngoài giờ'
                  : 'Tạo'
          }
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
              <WindowBanner />

              {serverError ? (
                <View style={styles.errorBanner}>
                  <MaterialIcons name='error-outline' size={18} color='#B91C1C' />
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
              ) : null}

              {successCount > 0 && !serverError ? (
                <View style={styles.successBanner}>
                  <MaterialIcons name='check-circle' size={18} color='#15803D' />
                  <Text style={styles.successBannerText}>
                    Đã tạo {successCount} nhật ký thành công. Bạn có thể tiếp tục hoặc đóng form.
                  </Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <TextField
                  label='Đã làm gì hôm nay *'
                  value={activities}
                  onChangeText={(v) => {
                    setActivities(v)
                    if (v.trim()) setActivitiesError('')
                    if (serverError) setServerError(null)
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
                  onChangeText={(v) => {
                    setNotes(v)
                    if (notesError) setNotesError('')
                  }}
                  multiline
                  numberOfLines={3}
                  error={notesError}
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

  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#15803D',
    fontFamily: 'Inter_500Medium',
  },

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
