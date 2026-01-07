'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  LucideIcon
} from 'lucide-react'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Users,
  FileText,
  Settings
}

interface NavItem {
  name: string
  href: string
  icon: string
}

interface AgencyNavProps {
  hotel: { name: string } | null
  navigation: NavItem[]
  onSignOut: () => void
  impersonationBannerHeight?: number
}

export default function AgencyNav({ hotel, navigation, onSignOut, impersonationBannerHeight = 0 }: AgencyNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed z-50 lg:hidden p-3 rounded-xl bg-white border border-gray-300 shadow-md hover:shadow-lg transition-all"
        style={{ top: `${20 + impersonationBannerHeight}px`, left: '20px' }}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5 text-gray-900" />
        ) : (
          <Menu className="h-5 w-5 text-gray-900" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMobileMenu}
          style={{ top: `${impersonationBannerHeight}px` }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 border-r border-blue-700 z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ top: `${impersonationBannerHeight}px` }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 py-3 border-b border-blue-700">
            <Image
              src="/logo.png"
              alt="BookingFocus Logo"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </div>

          {/* Role Indicator - Agency Dashboard */}
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center">
              <div className="px-3 py-1.5 bg-yellow-500 text-yellow-900 rounded-lg font-semibold text-sm">
                AGENCY
              </div>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">Agency Dashboard</p>
            <p className="text-xs text-blue-300 mt-1">Managing: {hotel?.name}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const IconComponent = iconMap[item.icon]
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-blue-700">
            <form action={onSignOut}>
              <button
                type="submit"
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-blue-100 rounded-lg hover:bg-blue-700 hover:text-white transition-colors duration-200"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
