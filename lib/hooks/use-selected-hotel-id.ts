import { useState, useEffect } from 'react'

const STORAGE_KEY = 'bookingboost_selected_hotel_id'

/**
 * Hook to get and track the selected hotel ID from localStorage
 * Automatically updates when hotel selection changes
 */
export function useSelectedHotelId() {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Get selected hotel ID from localStorage on mount
  useEffect(() => {
    const storedHotelId = localStorage.getItem(STORAGE_KEY)
    setSelectedHotelId(storedHotelId)
    setIsReady(true)
  }, [])

  // Listen for hotel selection changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedHotelId = localStorage.getItem(STORAGE_KEY)
      setSelectedHotelId(storedHotelId)
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event for same-tab changes
    window.addEventListener('hotelChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('hotelChanged', handleStorageChange)
    }
  }, [])

  return { selectedHotelId, isReady }
}
