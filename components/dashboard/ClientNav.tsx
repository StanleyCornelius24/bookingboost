'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  LineChart,
  HelpCircle,
  FileText,
  Upload,
  LogOut,
  BarChart3,
  List,
  Settings,
  Menu,
  X,
  LucideIcon
} from 'lucide-react'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  TrendingUp,
  Target,
  LineChart,
  HelpCircle,
  FileText,
  Upload,
  BarChart3,
  List,
  Settings
}

interface NavItem {
  name: string
  href: string
  icon: string
}

interface ClientNavProps {
  hotel: { name: string } | null
  navigation: NavItem[]
  onSignOut: () => void
}

export default function ClientNav({ hotel, navigation, onSignOut }: ClientNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-5 left-5 z-50 lg:hidden p-3 rounded-xl bg-white border border-soft-gray shadow-md hover:shadow-lg transition-all"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5 text-brand-navy" />
        ) : (
          <Menu className="h-5 w-5 text-brand-navy" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-soft-gray shadow-sm z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 py-3 border-b border-soft-gray bg-gradient-to-b from-white to-off-white">
            <Image
              src="/logo.png"
              alt="BookingFocus Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>

          {/* Role Indicator - Hotel Name */}
          <div className="px-6 py-4 border-b border-soft-gray bg-golden-cream/30">
            <p className="text-xs text-brand-navy/60 uppercase tracking-widest font-medium mb-1.5">
              Your Hotel
            </p>
            <p className="text-base font-semibold text-brand-navy">
              {hotel?.name}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pt-6 pb-4 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const IconComponent = iconMap[item.icon]
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-gold text-brand-navy font-semibold shadow-sm'
                      : 'text-brand-navy/80 font-book hover:bg-brand-gold/10 hover:text-brand-navy'
                  }`}
                >
                  {IconComponent && (
                    <IconComponent
                      className={`mr-3 h-4.5 w-4.5 transition-colors flex-shrink-0 ${
                        isActive
                          ? 'text-brand-navy'
                          : 'text-brand-navy/50 group-hover:text-brand-navy/70'
                      }`}
                    />
                  )}
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-soft-gray">
            <form action={onSignOut}>
              <button
                type="submit"
                className="flex items-center w-full px-4 py-3 text-sm font-book text-brand-navy/60 rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy transition-all duration-200 group"
              >
                <LogOut className="mr-3 h-4 w-4 text-brand-navy/40 group-hover:text-brand-navy/60 transition-colors" />
                <span className="tracking-tight">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
