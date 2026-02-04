'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Users,
  Building2,
  Settings,
  BarChart3,
  Tags,
  Shield,
  LogOut,
  Menu,
  X,
  FileText,
  UserCheck,
  LucideIcon
} from 'lucide-react'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  FileText,
  UserCheck,
  Building2,
  Users,
  Tags,
  Settings
}

interface NavItem {
  name: string
  href: string
  icon: string
}

interface AdminNavProps {
  navigation: NavItem[]
  onSignOut: () => void
}

export default function AdminNav({ navigation, onSignOut }: AdminNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-5 left-5 z-50 lg:hidden p-3 rounded-xl bg-white border border-gray-300 shadow-md hover:shadow-lg transition-all"
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
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 py-3 border-b border-gray-700">
            <Image
              src="/logo.png"
              alt="BookingFocus Logo"
              width={50}
              height={50}
              className="object-contain"
              priority
            />
          </div>

          {/* Role Indicator - Admin */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-red-400 mr-2" />
              <div className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold text-sm">
                ADMIN
              </div>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">Admin Dashboard</p>
            <p className="text-xs text-gray-400 mt-1">Full system access</p>
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
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-gray-700">
            <form action={onSignOut}>
              <button
                type="submit"
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
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
