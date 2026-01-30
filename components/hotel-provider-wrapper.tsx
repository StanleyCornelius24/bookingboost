'use client'

import { HotelProvider } from '@/lib/contexts/hotel-context'
import { ReactNode } from 'react'

export default function HotelProviderWrapper({ children }: { children: ReactNode }) {
  return <HotelProvider>{children}</HotelProvider>
}
