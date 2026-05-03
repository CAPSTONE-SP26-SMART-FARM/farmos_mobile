import { apiClient } from './client'
import type { MedicineCatalogRes } from '@/types/medicine'

export const medicineApi = {
  catalog: (q = '') => {
    const url = q ? `/medicines/catalog?q=${encodeURIComponent(q)}` : '/medicines/catalog'
    return apiClient.get<{ data: MedicineCatalogRes }>(url).then((r) => r.data.data)
  },
}
