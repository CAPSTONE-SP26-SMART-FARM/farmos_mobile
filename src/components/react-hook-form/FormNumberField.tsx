import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { NumberField, NumberFieldProps } from '@/components/ui'

export interface FormNumberFieldProps<T extends FieldValues>
  extends Omit<NumberFieldProps, 'value' | 'onChangeNumber' | 'onChangeText'> {
  control: Control<T>
  name: Path<T>
  rules?: RegisterOptions<T>
  isNumericValue?: boolean
}

export const FormNumberField = <T extends FieldValues>({
  control,
  name,
  rules,
  isNumericValue = true,
  maxValue = 1_000_000_000_000,
  ...props
}: FormNumberFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    rules={rules}
    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
      <NumberField
        {...props}
        value={value}
        maxValue={maxValue}
        onChangeNumber={(num) => {
          if (isNumericValue) onChange(num)
        }}
        onChangeText={(text) => {
          if (!isNumericValue) onChange(text)
        }}
        onBlur={() => {
          onBlur()
          if (isNumericValue && (value === null || value === undefined)) onChange(0)
        }}
        error={error?.message}
      />
    )}
  />
)
