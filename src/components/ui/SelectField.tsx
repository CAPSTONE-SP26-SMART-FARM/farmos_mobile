import React, { forwardRef, useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  Keyboard,
  StyleProp,
  ViewStyle,
  TextStyle,
  DimensionValue
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { TextField } from './TextField'
import { BottomSheet } from './BottomSheet'

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^0-9a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function search(text: string, options: any[], searchFields: string | string[] = 'label') {
  if (!text) return options
  const term = slugify(text.trim().toLowerCase())
  return options.filter((item) => {
    const fields = Array.isArray(searchFields) ? searchFields : [searchFields]
    return fields.some((field) => {
      const itemClean = slugify((item?.[field] ?? '').toLowerCase())
      return itemClean.includes(term) || term.includes(itemClean)
    })
  })
}

export interface SelectFieldProps {
  label: string
  value?: string | null
  error?: string
  readOnly?: boolean
  disabled?: boolean
  rightIcon?: keyof typeof Ionicons.glyphMap
  rightIconComponent?: React.ReactNode
  onRightIconPress?: () => void
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  showError?: boolean
  onPress?: () => void
  options?: any[]
  bottomSheetTitle?: string
  variant?: 'check' | 'radio'
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string | string[]
  labelExtractor?: (item: any) => string
  valueExtractor?: (item: any) => string | number
  subtitleExtractor?: (item: any) => string | undefined
  selectedValue?: string | number | null
  onSelect?: (item: any) => void
  renderLabel?: (item: any) => React.ReactNode
  height?: DimensionValue
}

export const SelectField = forwardRef<View, SelectFieldProps>(
  (
    {
      label,
      value,
      error,
      readOnly,
      disabled,
      rightIcon,
      rightIconComponent,
      onRightIconPress,
      containerStyle,
      inputStyle,
      showError = true,
      onPress,
      options,
      bottomSheetTitle,
      variant = 'check',
      searchable = false,
      searchPlaceholder = 'Tìm kiếm',
      searchFields = 'name',
      labelExtractor,
      valueExtractor,
      subtitleExtractor,
      selectedValue,
      onSelect,
      renderLabel,
      height
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false)
    const [searchText, setSearchText] = useState('')

    const filteredOptions = useMemo(() => {
      if (!options) return []
      if (!searchable || !searchText.trim()) return options
      return search(searchText, options, searchFields)
    }, [options, searchable, searchText, searchFields])

    const handlePress = () => {
      if (disabled || readOnly) return
      Keyboard.dismiss()
      if (options) {
        setVisible(true)
        setSearchText('')
      }
      onPress?.()
    }

    const handleSelectOption = (item: any) => {
      onSelect?.(item)
      setVisible(false)
    }

    return (
      <View style={styles.wrapper} ref={ref as any}>
        <Pressable onPress={handlePress}>
          <View pointerEvents='none'>
            <TextField
              label={label}
              value={value || ''}
              error={error}
              readOnly={readOnly}
              disabled={disabled}
              showClear={false}
              rightIcon={rightIconComponent ? undefined : rightIcon || 'chevron-down'}
              rightIconComponent={rightIconComponent}
              onRightIconPress={onRightIconPress}
              containerStyle={containerStyle}
              inputStyle={[inputStyle, !value && styles.transparentText]}
              showError={showError}
              onChangeText={() => {}}
              pointerEvents='none'
              editable={false}
            />
          </View>
        </Pressable>

        {options && (
          <BottomSheet
            visible={visible}
            onClose={() => setVisible(false)}
            containerStyle={
              variant === 'radio'
                ? { height: height || '80%', paddingHorizontal: 16 }
                : { height: height || '50%' }
            }
          >
            <BottomSheet.Header
              title={bottomSheetTitle || label}
              onClose={() => setVisible(false)}
            />

            {searchable && (
              <BottomSheet.Search
                placeholder={searchPlaceholder}
                value={searchText}
                onChangeText={setSearchText}
              />
            )}

            {variant === 'radio' ? (
              <BottomSheet.RadioOption
                data={filteredOptions}
                keyExtractor={(item) =>
                  valueExtractor ? valueExtractor(item).toString() : String(item)
                }
                labelExtractor={labelExtractor as any}
                valueExtractor={valueExtractor as any}
                selectedValue={selectedValue as string | number}
                onSelect={handleSelectOption}
                renderLabel={renderLabel}
              />
            ) : (
              <BottomSheet.ScrollView>
                <BottomSheet.SelectOption
                  data={filteredOptions}
                  keyExtractor={(item) =>
                    valueExtractor ? valueExtractor(item).toString() : String(item)
                  }
                  labelExtractor={labelExtractor as any}
                  subtitleExtractor={subtitleExtractor}
                  valueExtractor={valueExtractor as any}
                  selectedValue={selectedValue as string | number}
                  renderLabel={renderLabel}
                  onSelect={handleSelectOption}
                />
              </BottomSheet.ScrollView>
            )}
          </BottomSheet>
        )}
      </View>
    )
  }
)

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  transparentText: { color: 'transparent' }
})
