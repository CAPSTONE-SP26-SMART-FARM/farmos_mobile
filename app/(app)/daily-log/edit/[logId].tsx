import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet, Image, Pressable,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TextField, ImagePickerGrid } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { WindowBanner } from '@/components/features/dailyLog/WindowBanner'
import { useUpdateDailyLog } from '@/hooks/useDailyLog'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import { useImagePicker } from '@/hooks/useImagePicker'
import { uploadImageToCloudinary } from '@/utils/cloudinary'
import { isWithinDailyLogWindow } from '@/utils/dailyLogWindow'
import { extractApiError, getDailyLogErrorMessage } from '@/utils/error'
import type { AttachmentItem, DailyLog, MyDailyLogsRes } from '@/types/dailyLog'

const MAX_IMAGES = 5

type CachedPages = { pages: MyDailyLogsRes[]; pageParams: unknown[] }

/**
 * Tìm log đã cache trong các trang `useInfiniteQuery` của task hiện tại.
 * Tránh fetch lại vì BE chưa expose endpoint `GET /daily-log/farmer/:id`.
 */
function useCachedLog(taskId: string | undefined, logId: string): DailyLog | undefined {
  const qc = useQueryClient()
  return useMemo(() => {
    if (!taskId || !logId) return undefined
    const entries = qc.getQueriesData<CachedPages>({
      queryKey: ['daily-log', 'my-logs', taskId],
    })
    for (const [, data] of entries) {
      const pages = data?.pages ?? []
      for (const page of pages) {
        const hit = page.data.find((l) => l.id === logId)
        if (hit) return hit
      }
    }
    return undefined
  }, [qc, taskId, logId])
}

export default function DailyLogEditScreen() {
  const router = useRouter()
  const { logId, taskId } = useLocalSearchParams<{
    logId: string
    taskId?: string
    title?: string
  }>()

  const cached = useCachedLog(taskId, logId)
  const { showToast } = useToast()
  const { mutate, isPending } = useUpdateDailyLog()
  const justSavedRef = useRef(false)

  const [activities, setActivities] = useState(cached?.activities ?? '')
  const [notes, setNotes] = useState(cached?.notes ?? '')
  const [activitiesError, setActivitiesError] = useState('')
  const [notesError, setNotesError] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Existing attachments hiển thị riêng để user thấy ảnh cũ.
  // Khi user thêm/xóa mới qua picker → ta gửi list mới (replace toàn bộ).
  const initialAttachments = cached?.attachments ?? []
  const [keptAttachments, setKeptAttachments] = useState(initialAttachments)
  const [attachmentsTouched, setAttachmentsTouched] = useState(false)

  const newImageMax = Math.max(0, MAX_IMAGES - keptAttachments.length)
  const { imageUris, pick, remove, canAdd } = useImagePicker({ max: newImageMax })

  const [inWindow, setInWindow] = useState(isWithinDailyLogWindow())
  useEffect(() => {
    const id = setInterval(() => setInWindow(isWithinDailyLogWindow()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Khi cache đến muộn (vd cold-open edit screen từ deep link) — sync state.
  useEffect(() => {
    if (cached) {
      setActivities((v) => (v ? v : cached.activities))
      setNotes((v) => (v ? v : cached.notes ?? ''))
      setKeptAttachments((cur) => (cur.length === 0 ? cached.attachments : cur))
    }
  }, [cached])

  const removeKeptAttachment = (id: string) => {
    setKeptAttachments((cur) => cur.filter((a) => a.id !== id))
    setAttachmentsTouched(true)
  }

  const hasContentChange =
    cached &&
    (activities.trim() !== (cached.activities ?? '') ||
      notes.trim() !== (cached.notes ?? ''))
  const hasAttachmentsChange = attachmentsTouched || imageUris.length > 0
  const isDirty = !!hasContentChange || hasAttachmentsChange
  const canSubmit = activities.trim().length > 0 && isDirty && inWindow
  const isLoading = isPending || isUploading

  const resetErrors = () => {
    setActivitiesError('')
    setNotesError('')
    setServerError(null)
  }

  const handleSubmit = async () => {
    if (!inWindow) {
      const msg = 'Ngoài khung giờ làm việc. Chỉ chỉnh sửa nhật ký trong 07:00–17:00.'
      setServerError(msg)
      showToast.error({ message: msg })
      return
    }
    if (!activities.trim()) {
      setActivitiesError('Vui lòng mô tả công việc đã làm')
      return
    }
    resetErrors()

    // Build body partial — chỉ gửi field thay đổi.
    const body: { activities?: string; notes?: string; attachments?: AttachmentItem[] } = {}

    if (cached) {
      if (activities.trim() !== (cached.activities ?? '')) {
        body.activities = activities.trim()
      }
      if (notes.trim() !== (cached.notes ?? '')) {
        body.notes = notes.trim()
      }
    } else {
      body.activities = activities.trim()
      body.notes = notes.trim()
    }

    if (hasAttachmentsChange) {
      let newUrls: string[] = []
      if (imageUris.length > 0) {
        setIsUploading(true)
        try {
          newUrls = await Promise.all(imageUris.map(uploadImageToCloudinary))
        } catch {
          setServerError('Upload ảnh thất bại. Vui lòng kiểm tra mạng và thử lại.')
          showToast.error({ message: 'Upload ảnh thất bại' })
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }
      body.attachments = [
        ...keptAttachments.map((a) => ({
          url: a.url,
          fileName: a.fileName ?? undefined,
          mimeType: a.mimeType ?? undefined,
          sizeBytes: a.sizeBytes ?? undefined,
        })),
        ...newUrls.map((url) => ({ url })),
      ]
    }

    if (Object.keys(body).length === 0) {
      showToast.info({ message: 'Chưa có thay đổi nào để lưu' })
      return
    }

    mutate(
      { id: logId, body },
      {
        onSuccess: () => {
          justSavedRef.current = true
          showToast.success({ message: 'Đã cập nhật nhật ký' })
          setTimeout(() => {
            justSavedRef.current = false
            router.back()
          }, 50)
        },
        onError: (err) => {
          const ex = extractApiError(err)
          if (ex.fieldErrors.activities) setActivitiesError(ex.fieldErrors.activities)
          if (ex.fieldErrors.notes) setNotesError(ex.fieldErrors.notes)

          const friendly = getDailyLogErrorMessage(err)
          const banner =
            friendly ??
            ex.message ??
            Object.values(ex.fieldErrors)[0] ??
            'Cập nhật nhật ký thất bại. Vui lòng thử lại.'
          setServerError(banner)
          showToast.error({ message: banner })
        },
      },
    )
  }

  usePreventUnsavedChanges(isDirty && !justSavedRef.current && !isLoading, {
    message: 'Bạn đang chỉnh sửa nhật ký. Thoát ra sẽ mất các thay đổi.',
  })

  if (!cached) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.flex}>
          <SheetHeader title='Chỉnh sửa nhật ký' onCancel={() => router.back()} />
          <View style={styles.loadingWrap}>
            <ActivityIndicator color='#2463EB' />
            <Text style={styles.loadingHint}>
              Không tìm thấy dữ liệu nhật ký trong cache. Vui lòng mở lại từ danh sách.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.flex}>
        <SheetHeader
          title='Chỉnh sửa nhật ký'
          onCancel={() => router.back()}
          onDone={handleSubmit}
          doneLabel={
            isUploading
              ? 'Đang tải ảnh…'
              : isPending
                ? 'Đang lưu…'
                : !inWindow
                  ? 'Ngoài giờ'
                  : 'Lưu'
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

                {keptAttachments.length > 0 ? (
                  <View style={styles.keptWrap}>
                    <Text style={styles.keptLabel}>Ảnh đã đính kèm</Text>
                    <View style={styles.keptRow}>
                      {keptAttachments.map((att) => (
                        <View key={att.id} style={styles.keptItem}>
                          <View style={styles.keptThumb}>
                            <Image source={{ uri: att.url }} style={styles.keptThumbImg} />
                          </View>
                          <Pressable
                            onPress={() => removeKeptAttachment(att.id)}
                            style={styles.removeBtn}
                            hitSlop={6}
                          >
                            <MaterialIcons name='close' size={14} color='#FFFFFF' />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <ImagePickerGrid
                  label={
                    keptAttachments.length > 0
                      ? `Thêm ảnh mới (còn ${newImageMax} ô)`
                      : 'Ảnh đính kèm (tuỳ chọn)'
                  }
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

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingHint: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },

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
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  textareaContainer: { minHeight: 100 },

  keptWrap: { gap: 8 },
  keptLabel: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Inter_500Medium',
  },
  keptRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  keptItem: { width: 72, height: 72, position: 'relative' },
  keptThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  keptThumbImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
