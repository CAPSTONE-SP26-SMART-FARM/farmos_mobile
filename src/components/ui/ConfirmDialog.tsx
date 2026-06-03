import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from './Text'

// Một popup confirmation/lựa chọn dùng chung cho toàn app — thay cho Alert.alert
// (vốn render iOS native dialog, không đồng bộ với design system).
//
// 2 chế độ render dựa trên dữ liệu `actions`:
// - Compact (mọi action đều không có `description`): button row dạng iOS-alert style.
// - Rich (ít nhất 1 action có `description`): danh sách option-card (kiểu AbandonModal cũ).

export type ConfirmActionVariant = 'primary' | 'destructive' | 'default' | 'cancel'

export interface ConfirmAction {
  /** Key trả về qua promise của show() khi user chọn action này. */
  key: string
  label: string
  /** Subtitle ngắn — khi có sẽ kích hoạt render dạng card. */
  description?: string
  variant?: ConfirmActionVariant
}

export interface ConfirmDialogOptions {
  title: string
  message?: string
  /** 1-4 action. Action `cancel` thường nên là cái cuối (hoặc dùng `cancelable`). */
  actions: ConfirmAction[]
  /** Tap backdrop để đóng (resolve null). Default true. */
  cancelable?: boolean
  /** Tự pick icon theo loại dialog — chỉ dùng cho rich mode. */
  icon?: 'warning' | 'info' | 'question' | 'success' | 'error'
}

interface ConfirmContextValue {
  show: (options: ConfirmDialogOptions) => Promise<string | null>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm phải được dùng bên trong <ConfirmProvider>.')
  }
  return ctx
}

interface DialogState {
  options: ConfirmDialogOptions | null
  visible: boolean
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>({ options: null, visible: false })
  const resolverRef = useRef<((value: string | null) => void) | null>(null)

  const resolveAndClose = useCallback((value: string | null) => {
    const r = resolverRef.current
    resolverRef.current = null
    setState((prev) => ({ ...prev, visible: false }))
    if (r) r(value)
  }, [])

  const show = useCallback(
    (options: ConfirmDialogOptions): Promise<string | null> => {
      // Nếu đang có dialog mở → resolve cũ về null trước rồi mở dialog mới.
      if (resolverRef.current) {
        resolverRef.current(null)
        resolverRef.current = null
      }
      return new Promise<string | null>((resolve) => {
        resolverRef.current = resolve
        setState({ options, visible: true })
      })
    },
    [],
  )

  return (
    <ConfirmContext.Provider value={{ show }}>
      {children}
      <ConfirmDialog
        visible={state.visible}
        options={state.options}
        onAction={resolveAndClose}
      />
    </ConfirmContext.Provider>
  )
}

interface ConfirmDialogProps {
  visible: boolean
  options: ConfirmDialogOptions | null
  onAction: (key: string | null) => void
}

function ConfirmDialog({ visible, options, onAction }: ConfirmDialogProps) {
  // Giữ options trong state local để render được trong khi modal animate exit.
  const [localOptions, setLocalOptions] = useState(options)
  useEffect(() => {
    if (options) setLocalOptions(options)
  }, [options])

  if (!localOptions) return null

  const { title, message, actions, cancelable = true, icon } = localOptions
  const hasDescriptions = actions.some((a) => a.description)
  const handleBackdrop = () => {
    if (cancelable) onAction(null)
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      onRequestClose={handleBackdrop}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleBackdrop}>
        {/* Stop propagation: tap vào card không trigger backdrop dismiss */}
        <Pressable style={styles.cardWrapper} onPress={(e) => e.stopPropagation()}>
          <View style={styles.card}>
            {icon ? <IconBadge type={icon} /> : null}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
            </View>

            {hasDescriptions ? (
              <View style={styles.cardList}>
                {actions.map((a) => (
                  <ActionCard key={a.key} action={a} onPress={() => onAction(a.key)} />
                ))}
              </View>
            ) : (
              <View style={styles.buttonRow}>
                {actions.map((a, idx) => (
                  <ActionButton
                    key={a.key}
                    action={a}
                    isLast={idx === actions.length - 1}
                    onPress={() => onAction(a.key)}
                  />
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function IconBadge({ type }: { type: NonNullable<ConfirmDialogOptions['icon']> }) {
  const map = {
    warning:  { name: 'warning-amber',     bg: '#FEF3C7', color: '#B45309' },
    info:     { name: 'info-outline',      bg: '#DBEAFE', color: '#1D4ED8' },
    question: { name: 'help-outline',      bg: '#E0E7FF', color: '#4338CA' },
    success:  { name: 'check-circle',      bg: '#DCFCE7', color: '#15803D' },
    error:    { name: 'error-outline',     bg: '#FEE2E2', color: '#B91C1C' },
  } as const
  const meta = map[type]
  return (
    <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
      <MaterialIcons name={meta.name as any} size={26} color={meta.color} />
    </View>
  )
}

function ActionButton({
  action, isLast, onPress,
}: {
  action: ConfirmAction
  isLast: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.button, !isLast && styles.buttonDivider]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Text style={[styles.buttonLabel, buttonVariantStyle(action.variant)]}>
        {action.label}
      </Text>
    </TouchableOpacity>
  )
}

function ActionCard({
  action, onPress,
}: {
  action: ConfirmAction
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, cardVariantStyle(action.variant)]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.optionTitle, cardTitleVariantStyle(action.variant)]}>
        {action.label}
      </Text>
      {action.description ? (
        <Text style={styles.optionDesc}>{action.description}</Text>
      ) : null}
    </TouchableOpacity>
  )
}

function buttonVariantStyle(v?: ConfirmActionVariant): TextStyle {
  switch (v) {
    case 'destructive': return { color: '#DC2626', fontFamily: 'Inter_600SemiBold' }
    case 'primary':     return { color: '#15803D', fontFamily: 'Inter_600SemiBold' }
    case 'cancel':      return { color: '#374151', fontFamily: 'Inter_500Medium' }
    default:            return { color: '#15803D', fontFamily: 'Inter_500Medium' }
  }
}

function cardVariantStyle(v?: ConfirmActionVariant): ViewStyle {
  switch (v) {
    case 'destructive': return { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }
    case 'primary':     return { borderColor: '#15803D', backgroundColor: '#DCFCE7' }
    case 'cancel':      return { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }
    default:            return { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }
  }
}

function cardTitleVariantStyle(v?: ConfirmActionVariant): TextStyle {
  switch (v) {
    case 'destructive': return { color: '#DC2626' }
    case 'primary':     return { color: '#166534' }
    default:            return { color: '#111827' }
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  cardWrapper: { width: '100%', maxWidth: 360 },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },

  iconBadge: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 6, alignItems: 'center' },
  title: {
    fontSize: 17, lineHeight: 22, color: '#111827',
    fontFamily: 'Inter_600SemiBold', textAlign: 'center',
  },
  message: {
    fontSize: 13, lineHeight: 18, color: '#6B7280',
    fontFamily: 'Inter_400Regular', textAlign: 'center',
  },

  // Compact (iOS-alert style)
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  button: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
  },
  buttonLabel: { fontSize: 15, lineHeight: 20 },

  // Rich (card)
  cardList: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  optionCard: { padding: 14, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  optionTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 12, lineHeight: 16, color: '#6B7280', fontFamily: 'Inter_400Regular' },
})
