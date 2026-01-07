'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#28384d' }}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="BookingFocus Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BookingBoost</h1>
          <p className="mt-1 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ borderColor: '#d1d5db' }}
              onFocus={(e) => e.target.style.borderColor = '#28384d'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm hover:underline"
                style={{ color: '#ffcc4e' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ borderColor: '#d1d5db' }}
              onFocus={(e) => e.target.style.borderColor = '#28384d'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: '#28384d',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28384d'}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-medium hover:underline"
              style={{ color: '#ffcc4e' }}
            >
              Sign up
            </Link>
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            Powered by{' '}
            <a
              href="https://www.focusonline.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: '#ffcc4e' }}
            >
              Focus Online Travel
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
