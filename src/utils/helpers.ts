export const trim = (str: string | null | undefined): string | null => {
  if (!str) return null
  const normalized = str.trim().replace(/\s+/g, ' ')
  return normalized || null
}

export const buildUrlWithParams = (baseUrl: string, params?: Record<string, any>) => {
  if (!params) return baseUrl
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) searchParams.append(key, value.toString())
  })
  const qs = searchParams.toString()
  return qs ? `${baseUrl}?${qs}` : baseUrl
}

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function search(
  text: string,
  options: any[],
  searchFields: string | string[] = 'label'
) {
  if (!text) return options
  const term = slugify(text.trim().toLowerCase())
  return options.filter((item) => {
    const fields = Array.isArray(searchFields) ? searchFields : [searchFields]
    return fields.some((field) => {
      const itemClean = slugify(item?.[field]?.toLowerCase() || '')
      return itemClean.indexOf(term) > -1 || term.includes(itemClean)
    })
  })
}
