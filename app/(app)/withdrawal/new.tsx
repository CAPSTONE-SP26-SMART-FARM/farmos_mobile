import { View, StyleSheet, useWindowDimensions, Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { FormSelectField } from '@/components/react-hook-form/FormSelectField'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import { useBankAccountList } from '@/hooks/useBankAccounts'
import { useCreateWithdrawal } from '@/hooks/useWithdrawals'
import { useDoctorWalletSummary } from '@/hooks/useDoctorWallet'
import { WD_MIN_AMOUNT, WD_MAX_AMOUNT } from '@/constants/withdrawal'
import { formatVnd } from '@/utils/number'

type FormData = {
  amount: string
  bankAccountId: string
  doctorNote?: string
}

// Phần cố định phía trên vùng scroll (grabber + SheetHeader) trong formSheet.
const HEADER_HEIGHT = 160

export default function WithdrawalNewScreen() {
  const router = useRouter()
  const { height: screenHeight } = useWindowDimensions()
  const { showToast } = useToast()
  const { data: accounts = [] } = useBankAccountList()
  const { data: summary } = useDoctorWalletSummary()
  const balance = summary?.balance ?? 0

  const { mutate: create, isPending } = useCreateWithdrawal()

  const defaultBank = accounts.find((a) => a.isDefault) ?? accounts[0]

  const {
    control, handleSubmit, setValue, watch,
    formState: { isDirty, isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      amount: '',
      bankAccountId: '',
      doctorNote: '',
    },
  })

  useEffect(() => {
    if (defaultBank) setValue('bankAccountId', defaultBank.id)
  }, [defaultBank, setValue])

  const amountStr = watch('amount')
  const amount = parseInt((amountStr || '0').replace(/\./g, ''), 10)
  const amountError =
    amount > 0 && amount < WD_MIN_AMOUNT
      ? `Tối thiểu ${formatVnd(WD_MIN_AMOUNT)}`
      : amount > WD_MAX_AMOUNT
        ? `Tối đa ${formatVnd(WD_MAX_AMOUNT)}`
        : amount > balance
          ? 'Vượt quá số dư khả dụng'
          : null

  const canSave = !!amount && amount >= WD_MIN_AMOUNT && amount <= WD_MAX_AMOUNT && amount <= balance && !!watch('bankAccountId') && !isPending

  usePreventUnsavedChanges(isDirty && !isPending, {
    message: 'Bạn đang nhập yêu cầu rút. Thoát ra sẽ mất thay đổi.',
  })

  const onSubmit = (data: FormData) => {
    Keyboard.dismiss()
    const amountNum = parseInt(data.amount.replace(/\./g, ''), 10)
    create(
      {
        amount: amountNum,
        bankAccountId: data.bankAccountId,
        doctorNote: data.doctorNote?.trim() || undefined,
      },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã gửi yêu cầu rút tiền' })
          router.back()
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Không thể tạo yêu cầu'
          showToast.error({ message: String(msg) })
        },
      }
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />
      <SheetHeader
        title='Tạo yêu cầu rút tiền'
        onCancel={() => router.back()}
        onDone={handleSubmit(onSubmit)}
        doneLabel='Gửi'
        canDone={canSave && isValid}
      />

      {accounts.length === 0 ? (
        <View style={styles.noBankWrap}>
          <MaterialIcons name='account-balance' size={48} color='#D1D5DB' />
          <Text style={styles.noBankText}>Bạn chưa có tài khoản ngân hàng</Text>
          <Text style={styles.noBankHint}>Thêm tài khoản trước khi tạo yêu cầu rút</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={[styles.scroll, { height: screenHeight - HEADER_HEIGHT }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
          enableOnAndroid
          extraHeight={150}
        >
              <View style={styles.section}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                  <Text style={styles.balanceAmount}>{formatVnd(balance)}</Text>
                </View>
                <View style={styles.fields}>
                  <FormTextField
                    control={control}
                    name='amount'
                    label='Số tiền (VND)'
                    rules={{ required: true }}
                    showError={false}
                    showClear={false}
                    keyboardType='number-pad'
                    autoFocus
                    transform={(t) => {
                      const digits = t.replace(/[^0-9]/g, '')
                      return digits ? Number(digits).toLocaleString('vi-VN') : ''
                    }}
                  />
                  {!!amountError && <Text style={styles.errorText}>{amountError}</Text>}

                  <FormSelectField
                    control={control}
                    name='bankAccountId'
                    label='Tài khoản nhận'
                    rules={{ required: true }}
                    showError={false}
                    options={accounts}
                    bottomSheetTitle='Chọn tài khoản'
                    variant='radio'
                    labelExtractor={(item) => `${item.bankName} - ${item.accountNumber}`}
                    valueExtractor={(item) => item.id}
                    subtitleExtractor={(item) => item.accountHolderName}
                    rightIconComponent={
                      <MaterialIcons name='keyboard-arrow-down' size={22} color='#4B5563' />
                    }
                    height='60%'
                  />

                  <FormTextField
                    control={control}
                    name='doctorNote'
                    label='Ghi chú (tùy chọn)'
                    showError={false}
                    showClear={false}
                    multiline
                    numberOfLines={3}
                    maxLength={2000}
                  />
                </View>
              </View>

              <Text style={styles.hint}>
                * Số tiền từ {formatVnd(WD_MIN_AMOUNT)} đến {formatVnd(WD_MAX_AMOUNT)}.{'\n'}
                * Yêu cầu sẽ được admin duyệt trong vòng 24h.
              </Text>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },

  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 12, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  balanceLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  balanceAmount: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold' },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  fields: { gap: 12 },

  errorText: { fontSize: 12, color: '#DC2828', marginTop: -8, marginLeft: 4, fontFamily: 'Inter_400Regular' },
  hint: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 18, paddingHorizontal: 4 },

  noBankWrap: { alignItems: 'center', paddingTop: 80, gap: 12, padding: 24 },
  noBankText: { fontSize: 15, color: '#374151', fontFamily: 'Inter_500Medium' },
  noBankHint: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', textAlign: 'center' },
})
