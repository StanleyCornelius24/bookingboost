'use client'

import { useRouter } from 'next/navigation'
import { UserX, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface ImpersonationBannerProps {
  userEmail: string
  role: string
}

export default function ImpersonationBanner({ userEmail, role }: ImpersonationBannerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleExitImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to exit impersonation')

      // Redirect to admin dashboard
      router.push('/dashboard-admin')
      router.refresh()
    } catch (error) {
      console.error('Error exiting impersonation:', error)
      alert('Failed to exit impersonation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-3 py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-semibold">
            Impersonating: {userEmail} ({role})
          </span>
        </div>
        <button
          onClick={handleExitImpersonation}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1 text-sm bg-yellow-900 text-yellow-100 rounded hover:bg-yellow-800 transition-colors disabled:opacity-50"
        >
          <UserX className="h-3.5 w-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  )
}
