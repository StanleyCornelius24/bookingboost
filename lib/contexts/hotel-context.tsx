'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Hotel {
  id: string
  name: string
  email: string
  website: string | null
  currency: string
  user_id: string
  user_role: string
  is_primary: boolean
  display_order: number
  created_at: string
  updated_at: string
  // Additional fields from schema
  google_analytics_property_id?: string | null
  google_ads_customer_id?: string | null
  google_ads_manager_id?: string | null
  meta_ad_account_id?: string | null
  last_settings_sync?: string | null
}

interface HotelContextType {
  hotels: Hotel[]
  selectedHotel: Hotel | null
  selectedHotelId: string | null
  isLoading: boolean
  error: string | null
  setSelectedHotelId: (id: string) => void
  refreshHotels: () => Promise<void>
  addHotel: (hotel: Hotel) => void
}

const HotelContext = createContext<HotelContextType | undefined>(undefined)

const STORAGE_KEY = 'bookingboost_selected_hotel_id'

export function HotelProvider({ children }: { children: ReactNode }) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch hotels on mount
  const refreshHotels = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/hotels')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hotels')
      }

      setHotels(data.hotels || [])

      // If no hotel is selected, select the primary or first hotel
      if (!selectedHotelId && data.hotels.length > 0) {
        const primaryHotel = data.hotels.find((h: Hotel) => h.is_primary)
        const hotelToSelect = primaryHotel || data.hotels[0]
        setSelectedHotelIdState(hotelToSelect.id)
        localStorage.setItem(STORAGE_KEY, hotelToSelect.id)
      }

    } catch (err) {
      console.error('Error fetching hotels:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Try to restore selected hotel from localStorage
    const savedHotelId = localStorage.getItem(STORAGE_KEY)
    if (savedHotelId) {
      setSelectedHotelIdState(savedHotelId)
    }

    refreshHotels()
  }, [])

  // Update localStorage when selection changes
  const setSelectedHotelId = (id: string) => {
    setSelectedHotelIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  // Helper to add a newly created hotel to the list
  const addHotel = (hotel: Hotel) => {
    setHotels(prev => [...prev, hotel])
    // Automatically select the newly added hotel
    setSelectedHotelId(hotel.id)
  }

  // Get the currently selected hotel object
  const selectedHotel = hotels.find(h => h.id === selectedHotelId) || null

  const value: HotelContextType = {
    hotels,
    selectedHotel,
    selectedHotelId,
    isLoading,
    error,
    setSelectedHotelId,
    refreshHotels,
    addHotel
  }

  return (
    <HotelContext.Provider value={value}>
      {children}
    </HotelContext.Provider>
  )
}

export function useHotel() {
  const context = useContext(HotelContext)
  if (context === undefined) {
    throw new Error('useHotel must be used within a HotelProvider')
  }
  return context
}
