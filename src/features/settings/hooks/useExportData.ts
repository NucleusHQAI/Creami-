import { useMutation } from '@tanstack/react-query'
import { fetchExportData } from '@/lib/api/export'

/** Fetches everything exportable in one go — triggered on demand from the Export button. */
export function useExportData() {
  return useMutation({
    mutationFn: fetchExportData,
  })
}
