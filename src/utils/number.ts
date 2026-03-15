export const formatNumber = (
  value: number | string | null | undefined,
  precision?: number
): string => {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  const str = precision !== undefined ? num.toFixed(precision) : num.toString()
  const [integer, decimal] = str.split('.')
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimal !== undefined ? `${formattedInteger},${decimal}` : formattedInteger
}

export const roundTax = (value: number): number => {
  if (!value) return 0
  return Math.round(parseFloat(value.toPrecision(15)))
}
