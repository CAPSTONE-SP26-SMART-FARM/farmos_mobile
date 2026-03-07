// Re-export with zod resolver pre-wired
import { useForm as useRHFForm, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'

export function useForm<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'>,
) {
  return useRHFForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    ...options,
  })
}
