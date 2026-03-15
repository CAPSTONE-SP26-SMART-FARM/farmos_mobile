import React from 'react'
import { DimensionValue } from 'react-native'
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { SelectField } from '@/components/ui'

interface FormSelectFieldProps<T extends FieldValues, OptionType = any> {
  control: Control<T>
  name: Path<T>
  rules?: RegisterOptions<T>
  label: string
  options: OptionType[]
  bottomSheetTitle?: string
  variant?: 'check' | 'radio'
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string | string[]
  labelExtractor: (item: OptionType) => string
  valueExtractor: (item: OptionType) => string | number
  subtitleExtractor?: (item: OptionType) => string | undefined
  disabled?: boolean
  readOnly?: boolean
  showError?: boolean
  rightIconComponent?: React.ReactNode
  height?: DimensionValue
  onSelect?: (item: OptionType) => void
  renderLabel?: (item: OptionType) => React.ReactNode
}

export const FormSelectField = <T extends FieldValues, OptionType = any>({
  control,
  name,
  rules,
  label,
  options,
  bottomSheetTitle,
  variant,
  searchable,
  searchPlaceholder,
  searchFields,
  labelExtractor,
  valueExtractor,
  subtitleExtractor,
  disabled,
  readOnly,
  showError,
  rightIconComponent,
  onSelect,
  renderLabel,
  height,
}: FormSelectFieldProps<T, OptionType>) => (
  <Controller
    control={control}
    name={name}
    rules={rules}
    render={({ field: { onChange, value }, fieldState: { error } }) => {
      const selected = options.find((o) => valueExtractor(o) === value)
      return (
        <SelectField
          label={label}
          value={selected ? labelExtractor(selected) : ''}
          error={error?.message}
          showError={showError}
          disabled={disabled}
          readOnly={readOnly}
          rightIconComponent={rightIconComponent}
          options={options}
          bottomSheetTitle={bottomSheetTitle}
          variant={variant}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          searchFields={searchFields}
          labelExtractor={labelExtractor as any}
          valueExtractor={valueExtractor as any}
          subtitleExtractor={subtitleExtractor}
          selectedValue={value}
          onSelect={(item) => {
            onChange(valueExtractor(item))
            onSelect?.(item)
          }}
          height={height}
          renderLabel={renderLabel}
        />
      )
    }}
  />
)
