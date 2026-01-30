import { useSelectedHotelId } from './use-selected-hotel-id'

/**
 * Hook to build API URLs with the selected hotel ID
 * Usage: const buildUrl = useApiUrl()
 * Then: buildUrl('/api/client/dashboard')
 * Returns: '/api/client/dashboard?hotelId=xxx'
 */
export function useApiUrl() {
  const { selectedHotelId } = useSelectedHotelId()

  return (path: string, additionalParams?: Record<string, string | null | undefined>) => {
    const url = new URL(path, window.location.origin)

    if (selectedHotelId) {
      url.searchParams.set('hotelId', selectedHotelId)
    }

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.set(key, value)
        }
      })
    }

    return url.pathname + url.search
  }
}
