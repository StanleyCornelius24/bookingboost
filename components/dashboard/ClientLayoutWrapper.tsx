'use client'

import { ReactNode } from 'react'
import HotelProviderWrapper from '@/components/hotel-provider-wrapper'
import ClientNav from '@/components/dashboard/ClientNav'
import AIChatbot from '@/components/chatbot/AIChatbot'

interface ClientLayoutWrapperProps {
  hotel: { name: string } | null
  navigation: Array<{ name: string; href: string; icon: string }>
  onSignOut: () => void
  children: ReactNode
  impersonationBanner?: ReactNode
  hasImpersonation: boolean
}

export default function ClientLayoutWrapper({
  hotel,
  navigation,
  onSignOut,
  children,
  impersonationBanner,
  hasImpersonation
}: ClientLayoutWrapperProps) {
  return (
    <HotelProviderWrapper>
      <div className="min-h-screen bg-off-white">
        {/* Impersonation Banner */}
        {impersonationBanner}

        {/* Client Navigation */}
        <ClientNav hotel={hotel} navigation={navigation} onSignOut={onSignOut} />

        {/* Main Content - responsive padding */}
        <div className="lg:pl-64" style={hasImpersonation ? { paddingTop: '40px' } : {}}>
          <main className="p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </div>

        {/* AI Chatbot */}
        <AIChatbot />
      </div>
    </HotelProviderWrapper>
  )
}
