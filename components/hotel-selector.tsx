'use client'

import { useHotel } from '@/lib/contexts/hotel-context'
import { Hotel, ChevronDown, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HotelSelector() {
  const [isMounted, setIsMounted] = useState(false)

  // Only render after component mounts on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't access context until mounted on client
  if (!isMounted) {
    return null
  }

  return <HotelSelectorContent />
}

function HotelSelectorContent() {
  const { hotels, selectedHotel, selectedHotelId, setSelectedHotelId, isLoading } = useHotel()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectHotel = (hotelId: string) => {
    setSelectedHotelId(hotelId)
    setIsOpen(false)
    // Dispatch custom event for same-tab changes
    window.dispatchEvent(new Event('hotelChanged'))
    // Redirect to dashboard to show booking performance
    router.push('/dashboard-client')
  }

  const handleAddNewHotel = () => {
    setIsOpen(false)
    router.push('/hotels/add')
  }

  const handleManageHotels = () => {
    setIsOpen(false)
    router.push('/hotels/manage')
  }

  if (isLoading || hotels.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-gold/10 hover:bg-brand-gold/20 rounded-lg transition-colors"
      >
        <Hotel className="h-4 w-4 text-brand-navy" />
        <span className="text-sm font-medium text-brand-navy">
          {selectedHotel?.name || 'Select Hotel'}
        </span>
        <ChevronDown className={`h-4 w-4 text-brand-navy transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-soft-gray z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
              Your Hotels ({hotels.length})
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {hotels.map((hotel) => (
                <button
                  key={hotel.id}
                  onClick={() => handleSelectHotel(hotel.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    hotel.id === selectedHotelId
                      ? 'bg-brand-gold text-brand-navy font-semibold'
                      : 'hover:bg-gray-50 text-brand-navy'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">{hotel.name}</div>
                      {hotel.website && (
                        <div className="text-xs text-brand-navy/60 truncate">{hotel.website}</div>
                      )}
                    </div>
                    {hotel.is_primary && (
                      <span className="text-xs px-2 py-0.5 bg-tropical-teal/20 text-tropical-teal rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-soft-gray p-2 space-y-1">
            <button
              onClick={handleAddNewHotel}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-navy hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New Hotel
            </button>
            <button
              onClick={handleManageHotels}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-navy hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Hotel className="h-4 w-4" />
              Manage Hotels
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
