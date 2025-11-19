'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TabLayoutProps {
  children: React.ReactNode
  params: { hotelId: string }
}

export default function ClientDetailLayout({ children, params }: TabLayoutProps) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Overview',
      href: `/dashboard-agency/clients/${params.hotelId}`,
    },
    {
      name: 'Channels',
      href: `/dashboard-agency/clients/${params.hotelId}/channels`,
    },
    {
      name: 'Marketing',
      href: `/dashboard-agency/clients/${params.hotelId}/marketing`,
    },
    {
      name: 'Reports',
      href: `/dashboard-agency/clients/${params.hotelId}/reports`,
    }
  ]

  const isTabActive = (href: string) => {
    if (href === `/dashboard-agency/clients/${params.hotelId}`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`py-2 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isTabActive(tab.href)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  )
}