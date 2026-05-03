import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { FormTextField } from '@/components/react-hook-form/FormTextField'
import { FormSelectField } from '@/components/react-hook-form/FormSelectField'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import { useBankAccountList, useCreateBankAccount, useUpdateBankAccount } from '@/hooks/useBankAccounts'
import { BANKS } from '@/constants/banks'
import type { CreateBankAccountBody } from '@/types/bankAccount'

type FormData = CreateBankAccountBody

export default function BankAccountFormScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEdit = !!id

  const { data: accounts = [] } = useBankAccountList()
  const existing = isEdit ? accounts.find((a) => a.id === id) : undefined

  const { mutate: create, isPending: isCreating } = useCreateBankAccount()
  const updateMutation = useUpdateBankAccount(id || '')
  const isUpdating = updateMutation.isPending
  const isSubmitting = isCreating || isUpdating

  const { control, handleSubmit, reset, setValue, watch, formState: { isDirty, isValid } } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      branch: undefined,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        bankCode: existing.bankCode,
        bankName: existing.bankName,
        accountNumber: existing.accountNumber,
        accountHolderName: existing.accountHolderName,
        branch: existing.branch || undefined,
      })
    }
  }, [existing, reset])

  const bankCode = watch('bankCode')
  const accountNumber = watch('accountNumber')
  const accountHolderName = watch('accountHolderName')
  const canSave = !!bankCode && !!accountNumber?.trim() && !!accountHolderName?.trim() && !isSubmitting

  usePreventUnsavedChanges(isDirty && !isSubmitting, {
    message: 'Bạn đang nhập thông tin tài khoản. Thoát ra sẽ mất các thay đổi.',
  })

  const onSubmit = (data: FormData) => {
    Keyboard.dismiss()
    if (isEdit) {
      updateMutation.mutate(data, {
        onSuccess: () => {
          showToast.success({ message: 'Cập nhật tài khoản thành công' })
          router.back()
        },
        onError: () => showToast.error({ message: 'Cập nhật thất bại' }),
      })
    } else {
      create(data, {
        onSuccess: () => {
          showToast.success({ message: 'Thêm tài khoản thành công' })
          router.back()
        },
        onError: () => showToast.error({ message: 'Thêm tài khoản thất bại' }),
      })
    }
  }

  const handleSave = handleSubmit(onSubmit)

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />
      <SheetHeader
        title={isEdit ? 'Sửa tài khoản' : 'Thêm tài khoản'}
        onCancel={() => router.back()}
        onDone={handleSave}
        doneLabel='Lưu'
        canDone={canSave && isValid}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <View style={styles.section}>
              <View style={styles.fields}>
                <FormSelectField
                  control={control}
                  name='bankCode'
                  label='Ngân hàng'
                  rules={{ required: true }}
                  showError={false}
                  options={BANKS as any[]}
                  bottomSheetTitle='Chọn ngân hàng'
                  variant='radio'
                  searchable
                  searchPlaceholder='Tìm ngân hàng'
                  searchFields={['name', 'code']}
                  labelExtractor={(item) => item.name}
                  valueExtractor={(item) => item.code}
                  subtitleExtractor={(item) => item.code}
                  onSelect={(item) => setValue('bankName', item.name, { shouldDirty: true, shouldValidate: true })}
                  rightIconComponent={
                    <MaterialIcons name='keyboard-arrow-down' size={22} color='#4B5563' />
                  }
                  height='80%'
                />
                <FormTextField
                  control={control}
                  name='accountNumber'
                  label='Số tài khoản'
                  rules={{ required: true }}
                  showError={false}
                  showClear={false}
                  keyboardType='number-pad'
                />
                <FormTextField
                  control={control}
                  name='accountHolderName'
                  label='Chủ tài khoản'
                  rules={{ required: true }}
                  showError={false}
                  showClear={false}
                  autoCapitalize='characters'
                />
                <FormTextField
                  control={control}
                  name='branch'
                  label='Chi nhánh (tùy chọn)'
                  showError={false}
                  showClear={false}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12 },
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  fields: { gap: 12 },
})
