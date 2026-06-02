import { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { BottomSheet, Text, PrimaryButton } from '@/components/ui'
import { WindowBanner } from './WindowBanner'
import { isWithinDailyLogWindow } from '@/utils/dailyLogWindow'
import { getProgressColor } from '@/utils/progressColor'

interface Props {
  visible: boolean
  initialValue: number
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (value: number) => void
}

const THUMB_SIZE = 28
const TRACK_HEIGHT = 14

export function ProgressUpdateSheet({
  visible,
  initialValue,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(clamp(initialValue))
  const [trackWidth, setTrackWidth] = useState(0)
  const [inWindow, setInWindow] = useState(isWithinDailyLogWindow())
  const trackWidthRef = useRef(0)

  useEffect(() => {
    if (visible) {
      setValue(clamp(initialValue))
      setInWindow(isWithinDailyLogWindow())
      const id = setInterval(() => setInWindow(isWithinDailyLogWindow()), 60_000)
      return () => clearInterval(id)
    }
  }, [visible, initialValue])

  const dirty = value !== clamp(initialValue)
  const color = getProgressColor(value)

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    trackWidthRef.current = w
    setTrackWidth(w)
  }

  const xToValue = (x: number) => {
    const w = trackWidthRef.current
    if (w <= 0) return 0
    return clamp(Math.round((x / w) * 100))
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => setValue(xToValue(e.x)))
    .onUpdate((e) => setValue(xToValue(e.x)))
    .runOnJS(true)

  const fillWidth = trackWidth > 0 ? (trackWidth * value) / 100 : 0
  const thumbLeft = fillWidth - THUMB_SIZE / 2

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheet.Header title='Cập nhật tiến độ' onClose={onClose} />

      <View style={styles.body}>
        <WindowBanner compact />

        <View style={styles.valueWrap}>
          <Text style={[styles.value, { color }]}>{value}%</Text>
          <Text style={styles.hint}>Kéo thanh để chỉnh tiến độ</Text>
        </View>

        <GestureDetector gesture={pan}>
          <View style={styles.sliderArea} collapsable={false}>
            <View style={styles.track} onLayout={onTrackLayout}>
              <View
                style={[styles.fill, { width: fillWidth, backgroundColor: color }]}
              />
              {trackWidth > 0 ? (
                <View
                  style={[
                    styles.thumb,
                    {
                      left: thumbLeft,
                      borderColor: color,
                    },
                  ]}
                >
                  <View style={[styles.thumbDot, { backgroundColor: color }]} />
                </View>
              ) : null}
            </View>
          </View>
        </GestureDetector>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>0%</Text>
          <Text style={styles.scaleText}>50%</Text>
          <Text style={styles.scaleText}>100%</Text>
        </View>

        <PrimaryButton
          title={inWindow ? 'Lưu tiến độ' : 'Ngoài giờ làm việc'}
          onPress={() => onConfirm(value)}
          disabled={!dirty || isSubmitting || !inWindow}
          loading={isSubmitting}
          style={styles.cta}
        />
      </View>
    </BottomSheet>
  )
}

function clamp(n: number) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 16 },
  valueWrap: { alignItems: 'center', marginTop: 4, gap: 4 },
  value: { fontSize: 44, lineHeight: 52, fontFamily: 'Inter_700Bold' },
  hint: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },

  sliderArea: {
    height: THUMB_SIZE + 16,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    paddingHorizontal: THUMB_SIZE / 2,
  },
  scaleText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },

  cta: { marginTop: 8 },
})
