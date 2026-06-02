import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PillTabs } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'

interface Props<T extends string> {
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  /** Hiện spinner nhỏ cuối ô search khi đang debounce/loading. */
  isSearching?: boolean

  filterItems: readonly PillTabItem<T>[]
  filterValue: T
  onFilterChange: (v: T) => void
}

/**
 * Toolbar dùng chung cho mọi tab trong màn milestone detail.
 * Cố tình giữ cấu trúc cố định: search trên, filter pills dưới —
 * để 2 tab "Cảm biến" và "Công việc" luôn đồng bộ layout khi switch.
 */
export function MilestoneTabToolbar<T extends string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  isSearching,
  filterItems,
  filterValue,
  onFilterChange,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.searchBar}>
        <Ionicons name='search-outline' size={18} color='#9CA3AF' />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor='#9CA3AF'
          value={searchValue}
          onChangeText={onSearchChange}
          returnKeyType='search'
          autoCapitalize='none'
          autoCorrect={false}
        />
        {isSearching ? (
          <ActivityIndicator size='small' color='#9CA3AF' />
        ) : searchValue.length > 0 ? (
          <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
            <Ionicons name='close-circle' size={18} color='#9CA3AF' />
          </Pressable>
        ) : null}
      </View>

      <PillTabs items={filterItems} value={filterValue} onChange={onFilterChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#111827',
    padding: 0,
  },
})
