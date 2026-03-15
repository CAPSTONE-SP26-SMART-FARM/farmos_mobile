import React, { forwardRef, useCallback, useMemo, useState } from 'react'
import { TextInput } from 'react-native'
import { TextField, TextFieldProps } from './TextField'

export interface NumberFieldProps extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'defaultValue'
> {
  value?: number | string | null
  defaultValue?: number | string | null
  onChangeNumber?: (value: number | null) => void
  onChangeText?: (text: string) => void
  thousandSeparator?: boolean
  precision?: number
  allowNegative?: boolean
  maxValue?: number
}

export const NumberField = forwardRef<TextInput, NumberFieldProps>(
  (
    {
      value,
      defaultValue,
      onChangeNumber,
      onChangeText,
      thousandSeparator = true,
      precision,
      allowNegative = false,
      maxValue,
      keyboardType = 'number-pad',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [localText, setLocalText] = useState<string | null>(null)

    const getCleanNumeric = useCallback(
      (input: string | number | null | undefined): string => {
        if (input === undefined || input === null || input === '') return ''
        let str = typeof input === 'number' ? input.toString() : input

        const lastDot = str.lastIndexOf('.')
        const lastComma = str.lastIndexOf(',')
        if (lastDot !== -1 && lastComma !== -1) {
          str =
            lastDot > lastComma
              ? str.replace(/,/g, '')
              : str.replace(/\./g, '').replace(/,/g, '.')
        } else if (lastComma !== -1) {
          str =
            (str.match(/,/g) || []).length > 1
              ? str.replace(/,/g, '')
              : str.replace(/,/g, '.')
        } else if (lastDot !== -1 && (str.match(/\./g) || []).length > 1) {
          str = str.replace(/\./g, '')
        }

        let numeric = str.replace(allowNegative ? /[^-0-9.]/g : /[^0-9.]/g, '')
        if (allowNegative && numeric.includes('-')) {
          numeric = (numeric.startsWith('-') ? '-' : '') + numeric.replace(/-/g, '')
        }
        const parts = numeric.split('.')
        if (parts.length > 2) numeric = parts[0] + '.' + parts.slice(1).join('')

        if (numeric === '' || numeric === '-') return numeric
        const numValue = parseFloat(numeric)
        if (isNaN(numValue)) return ''

        if (precision === 0 || precision === undefined) {
          return Math.round(numValue).toString()
        }
        const [int, dec] = numeric.split('.')
        return dec && dec.length > precision
          ? `${int}.${dec.slice(0, precision)}`
          : numeric
      },
      [allowNegative, precision]
    )

    const formatDisplay = useCallback(
      (numeric: string): string => {
        if (numeric === '' || numeric === '-') return numeric
        const [integer, decimal] = numeric.split('.')
        const formattedInt = thousandSeparator
          ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          : integer
        return decimal !== undefined ? `${formattedInt},${decimal}` : formattedInt
      },
      [thousandSeparator]
    )

    const displayValue = useMemo(() => {
      if (isFocused && localText !== null) return localText
      const val = value !== undefined ? value : defaultValue
      const numeric = getCleanNumeric(val)
      if (isFocused && (numeric === '0' || numeric === '')) return ''
      return formatDisplay(numeric)
    }, [isFocused, localText, value, defaultValue, getCleanNumeric, formatDisplay])

    const handleFocus = (e: any) => {
      setIsFocused(true)
      const numeric = getCleanNumeric(value !== undefined ? value : defaultValue)
      setLocalText(numeric === '0' ? '' : formatDisplay(numeric))
      props.onFocus?.(e)
    }

    const handleBlur = (e: any) => {
      setIsFocused(false)
      setLocalText(null)
      props.onBlur?.(e)
    }

    const handleChangeText = (text: string) => {
      const isPaste = Math.abs(text.length - (displayValue?.length || 0)) > 1
      const processed = isPaste ? text : text.replace(/\./g, '').replace(/,/g, '.')
      const clean = getCleanNumeric(processed)

      if (maxValue !== undefined && clean !== '' && clean !== '-') {
        const numValue = parseFloat(clean)
        if (!isNaN(numValue) && numValue > maxValue) return
      }

      setLocalText(formatDisplay(clean))
      onChangeText?.(clean)
      if (clean === '' || clean === '-') {
        onChangeNumber?.(null)
      } else {
        const num = parseFloat(clean)
        onChangeNumber?.(isNaN(num) ? null : num)
      }
    }

    return (
      <TextField
        {...props}
        ref={ref}
        value={displayValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType={keyboardType}
        selectTextOnFocus={false}
      />
    )
  }
)
