import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { medicineApi } from '@/services/api/medicine'

export function useMedicineCatalog(q = '') {
  return useQuery({
    queryKey: queryKeys.medicine.catalog(q),
    queryFn: () => medicineApi.catalog(q),
    staleTime: 5 * 60 * 1000,
  })
}
