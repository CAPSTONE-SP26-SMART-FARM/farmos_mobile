import React, { useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, View, Dimensions, LayoutRectangle } from 'react-native'
import { Text } from './Text'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface TooltipProps {
  children: React.ReactElement
  content: string | React.ReactNode
  width?: number
  placement?: 'top' | 'bottom'
}

export const Tooltip = ({
  children,
  content,
  width = 190,
  placement = 'top'
}: TooltipProps) => {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const triggerRef = useRef<View>(null)

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setCoords({ x, y, width: w, height: h })
      setVisible(true)
    })
  }

  const getTooltipStyle = () => {
    if (!coords) return {}
    const tooltipX = Math.max(16, Math.min(SCREEN_WIDTH - width - 16, coords.x + coords.width / 2 - width / 2))
    if (placement === 'bottom') {
      return { position: 'absolute' as const, left: tooltipX, top: coords.y + coords.height + 10, width }
    }
    return { position: 'absolute' as const, left: tooltipX, bottom: SCREEN_HEIGHT - coords.y + 8, width }
  }

  const getArrowStyle = () => {
    if (!coords) return {}
    const tooltipLeft = (getTooltipStyle().left as number) || 0
    const arrowX = coords.x + coords.width / 2 - tooltipLeft - 6
    if (placement === 'bottom') return { top: -6, left: arrowX, borderTopWidth: 1, borderLeftWidth: 1 }
    return { bottom: -6, left: arrowX, borderBottomWidth: 1, borderRightWidth: 1 }
  }

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable onPress={handleOpen}>{children}</Pressable>
      </View>
      <Modal transparent visible={visible} animationType='fade' onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.contentContainer, getTooltipStyle()]}>
            <View style={styles.content}>
              {typeof content === 'string' ? (
                <Text style={styles.text}>{content}</Text>
              ) : (
                content
              )}
              <View style={[styles.arrow, getArrowStyle()]} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent' },
  contentContainer: { zIndex: 1000 },
  content: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative'
  },
  text: { fontSize: 12, lineHeight: 18, color: '#FFFFFF', textAlign: 'center' },
  arrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#111827',
    transform: [{ rotate: '45deg' }]
  }
})
