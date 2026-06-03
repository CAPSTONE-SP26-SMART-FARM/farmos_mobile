import React, { useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Text, TopBar, BottomSheet, useConfirm } from '@/components/ui'
import {
  useBankAccountList,
  useDeleteBankAccount,
  useSetDefaultBankAccount,
} from '@/hooks/useBankAccounts'
import { useToast } from '@/hooks/useToast'
import type { DoctorBankAccount } from '@/types/bankAccount'

export default function BankAccountsScreen() {
  const router = useRouter()
  const { data: accounts = [], isLoading } = useBankAccountList()

  const handleAddNew = () => router.push('/(app)/bank-accounts/form')

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title="Tài khoản ngân hàng" />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách tài khoản</Text>
          {accounts.length > 0 && (
            <Pressable style={styles.createLink} onPress={handleAddNew}>
              <MaterialIcons name="add" size={20} color="#15803D" />
              <Text style={styles.createLinkText}>Thêm tài khoản NH khác</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#15803D" style={{ marginTop: 40 }} />
        ) : accounts.length === 0 ? (
          <Empty onAction={handleAddNew} />
        ) : (
          <View style={styles.cardGroup}>
            {accounts.map(item => (
              <BankAccountCard key={item.id} account={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Empty({ onAction }: { onAction: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <MaterialIcons name="account-balance" size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>Chưa có tài khoản ngân hàng</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAction}>
        <Text style={styles.emptyBtnText}>+ Thêm tài khoản</Text>
      </TouchableOpacity>
    </View>
  )
}

function BankAccountCard({ account }: { account: DoctorBankAccount }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.titleRow}>
          <Text style={styles.bankName} numberOfLines={1}>
            {account.bankName}
          </Text>
          {account.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>
        <BankAccountAction account={account} />
      </View>

      <View style={styles.cardBottom}>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountNumber}>{account.accountNumber}</Text>
          <Text style={styles.accountHolder}>{account.accountHolderName}</Text>
          {account.branch && <Text style={styles.branch}>CN: {account.branch}</Text>}
        </View>
      </View>
    </View>
  )
}

function BankAccountAction({ account }: { account: DoctorBankAccount }) {
  const router = useRouter()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { mutate: deleteAccount } = useDeleteBankAccount()
  const { mutate: setDefault } = useSetDefaultBankAccount()
  const [visible, setVisible] = useState(false)

  const onClose = () => setVisible(false)

  const handleEdit = () => {
    onClose()
    router.push({ pathname: '/(app)/bank-accounts/form', params: { id: account.id } })
  }

  const handleSetDefault = () => {
    onClose()
    setDefault(account.id, {
      onSuccess: () => showToast.success({ message: 'Đã đặt làm mặc định' }),
      onError: () => showToast.error({ message: 'Không thể đặt mặc định' }),
    })
  }

  const handleDelete = async () => {
    onClose()
    const choice = await confirm.show({
      title: 'Xoá tài khoản?',
      message: `Xoá ${account.bankName} - ${account.accountNumber}?`,
      icon: 'warning',
      actions: [
        { key: 'cancel', label: 'Huỷ', variant: 'cancel' },
        { key: 'delete', label: 'Xoá', variant: 'destructive' },
      ],
    })
    if (choice !== 'delete') return
    deleteAccount(account.id, {
      onSuccess: () => showToast.success({ message: 'Đã xoá tài khoản' }),
      onError: () => showToast.error({ message: 'Xoá thất bại' }),
    })
  }

  const actions = [
    { id: 'edit', label: 'Chỉnh sửa', onPress: handleEdit, show: true },
    {
      id: 'default',
      label: 'Đặt làm mặc định',
      onPress: handleSetDefault,
      show: !account.isDefault,
    },
    { id: 'delete', label: 'Xoá tài khoản', onPress: handleDelete, isDelete: true, show: true },
  ].filter(a => a.show)

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.6}
      >
        <View style={[styles.moreBtn, visible && styles.moreBtnActive]}>
          <MaterialIcons name="more-horiz" size={20} color={visible ? '#111827' : '#6B7280'} />
        </View>
      </TouchableOpacity>

      <BottomSheet visible={visible} onClose={onClose}>
        <BottomSheet.Header title="Thao tác" onClose={onClose} />
        <View style={styles.sheetContent}>
          {actions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={action.onPress}
                activeOpacity={0.5}
              >
                <Text style={[styles.actionLabel, action.isDelete && styles.actionLabelDelete]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_500Medium',
    color: '#1F2937',
    flexShrink: 1,
  },
  createLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  createLinkText: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_500Medium', color: '#15803D' },

  cardGroup: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bankName: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1F2937',
    flexShrink: 1,
  },
  defaultBadge: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#0284C7' },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  accountNumber: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#374151', marginBottom: 2 },
  accountHolder: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#6B7280' },
  branch: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#9CA3AF', marginTop: 2 },

  moreBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  moreBtnActive: { backgroundColor: '#F3F4F6' },

  sheetContent: { paddingBottom: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, gap: 14 },
  actionLabel: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#111827', lineHeight: 22 },
  actionLabelDelete: { color: '#DC2828' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  emptyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#15803D',
    borderRadius: 8,
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_500Medium' },
})
