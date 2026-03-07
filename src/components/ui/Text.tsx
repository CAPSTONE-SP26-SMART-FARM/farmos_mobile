import { Text as RNText, TextProps } from 'react-native'

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label'

interface TypographyProps extends TextProps {
  variant?: Variant
}

const variantClass: Record<Variant, string> = {
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-800',
  body: 'text-base text-gray-700',
  caption: 'text-xs text-gray-500',
  label: 'text-sm font-medium text-gray-700',
}

export function Text({ variant = 'body', className, ...props }: TypographyProps) {
  return <RNText className={`${variantClass[variant]} ${className ?? ''}`} {...props} />
}
