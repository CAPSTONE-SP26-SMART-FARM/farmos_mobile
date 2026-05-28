import { useMemo, useState } from 'react'
import {
  View, FlatList as RNFlatList, Pressable, StyleSheet, TextInput, ActivityIndicator,
  Platform, Dimensions,
} from 'react-native'
import { FlatList as GHFlatList } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, EmptyState } from '@/components/ui'
import { icons } from '@/constants/icon'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useMedicineCatalog } from '@/hooks/useMedicine'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useResolveStore, type RxItem } from '@/stores/resolveStore'
import { useToast } from '@/hooks/useToast'
import type { Medicine } from '@/types/medicine'

const FlatList = Platform.OS === 'android' ? GHFlatList : RNFlatList
const SCREEN_HEIGHT = Dimensions.get('window').height
const HEADER_HEIGHT = 56
const SEARCH_HEIGHT = 60
const LIST_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - SEARCH_HEIGHT - 100

export default function SelectMedicineScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const addItems = useResolveStore((s) => s.addItems)
  const items = useResolveStore((s) => s.items)
  const existingIds = useMemo(
    () => new Set(items.map((i) => i.medicineId).filter(Boolean) as string[]),
    [items],
  )

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 400)
  const isDebouncing = search.trim() !== debouncedSearch
  const { data, isLoading } = useMedicineCatalog(debouncedSearch)
  const medicines = data?.data ?? []

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const canDone = selectedIds.size > 0

  const toggle = (m: Medicine) => {
    if (existingIds.has(m.id)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(m.id)) next.delete(m.id)
      else next.add(m.id)
      return next
    })
  }

  const handleDone = () => {
    if (!canDone) return
    const newItems: RxItem[] = medicines
      .filter((m) => selectedIds.has(m.id))
      .map((m) => ({
        _displayName: m.name,
        medicineId: m.id,
        dosage: '',
        frequency: '',
        usageInstructions: '',
      }))
    addItems(newItems)
    if (newItems.some((i) => medicines.find((m) => m.id === i.medicineId)?.withdrawalPeriodDays)) {
      showToast.info({ message: 'Có thuốc cần lưu ý thời gian ngừng — kiểm tra hướng dẫn sử dụng' })
    }
    router.back()
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <SheetHeader
        title='Chọn thuốc'
        onCancel={() => router.back()}
        onDone={handleDone}
        canDone={canDone}
      />

      <View style={styles.searchContainer}>
        <MaterialIcons name='search' size={24} color='#4B5563' />
        <TextInput
          style={styles.searchInput}
          placeholder='Tìm thuốc'
          placeholderTextColor='#9CA3AF'
          value={search}
          onChangeText={setSearch}
          returnKeyType='search'
          autoCorrect={false}
          autoCapitalize='none'
        />
        {isDebouncing && <ActivityIndicator size='small' color='#9CA3AF' />}
      </View>

      <FlatList
        data={medicines}
        keyExtractor={(m) => m.id}
        style={styles.list}
        nestedScrollEnabled
        keyboardShouldPersistTaps='handled'
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color='#2463EB' style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              Icon={icons.emptySearchSvg}
              message={
                debouncedSearch
                  ? `Không tìm thấy thuốc "${debouncedSearch}"`
                  : 'Chưa có thuốc trong danh mục'
              }
            />
          )
        }
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id)
          const isDisabled = existingIds.has(item.id)
          return (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && !isDisabled && { opacity: 0.7 },
                isDisabled && styles.rowDisabled,
              ]}
              onPress={() => toggle(item)}
              disabled={isDisabled}
            >
              <View style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
                isDisabled && styles.checkboxDisabled,
              ]}>
                {(isSelected || isDisabled) && (
                  <MaterialIcons name='check' size={14} color={isDisabled ? '#9CA3AF' : '#FFFFFF'} />
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                {item.scientificName ? (
                  <Text style={styles.subtitle} numberOfLines={1}>{item.scientificName}</Text>
                ) : null}
              </View>
              {item.withdrawalPeriodDays ? (
                <Text style={styles.warning}>⚠️ {item.withdrawalPeriodDays}d</Text>
              ) : null}
            </Pressable>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  searchContainer: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: 16, marginTop: 8, marginBottom: 8,
    paddingHorizontal: 14, height: 44,
    borderRadius: 22, backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1, height: 44, fontSize: 16,
    padding: 0, includeFontPadding: false,
  },

  list: { flex: 1, height: LIST_HEIGHT },
  divider: { height: 1, marginHorizontal: 20, backgroundColor: '#F3F4F6' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  rowDisabled: { opacity: 0.6 },

  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#2463EB', borderColor: '#2463EB' },
  checkboxDisabled: { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' },

  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_500Medium', color: '#111827' },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#4B5563' },

  warning: { fontSize: 12, color: '#D97706', fontFamily: 'Inter_500Medium' },
})
