'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, Calendar, TrendingUp, AlertTriangle, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApiUrl } from '@/lib/hooks/use-api-url'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'

interface MonthlyReviewData {
  month: string
  count: number
  averageRating: number
  reviews: any[]
}

interface RecentReview {
  author: string
  rating: number
  comment: string
  createTime: string
  reviewReply: string | null
}

interface ReviewsData {
  totalReviews: number
  averageRating: number
  monthlyData: MonthlyReviewData[]
  recentReviews: RecentReview[]
}

export default function ReviewsPage() {
  const router = useRouter()
  const buildUrl = useApiUrl()
  const { selectedHotelId, isReady } = useSelectedHotelId()
  const [loading, setLoading] = useState(true)
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isReady) {
      fetchReviewsData()
    }
  }, [selectedHotelId, isReady])

  const fetchReviewsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = buildUrl('/api/integrations/google/reviews')
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch reviews')
      }

      const data = await response.json()
      setReviewsData(data)
    } catch (err) {
      console.error('Failed to fetch reviews data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
      setReviewsData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA').format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-brand-gold text-brand-gold'
                : 'fill-none text-brand-navy/20'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-10 bg-soft-gray rounded-xl w-64 mb-4"></div>
          <div className="h-5 bg-soft-gray rounded-lg w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-soft-gray shadow-sm animate-pulse">
              <div className="h-4 bg-soft-gray rounded w-20 mb-3"></div>
              <div className="h-8 bg-soft-gray rounded w-24 mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy mb-2">Google Reviews</h1>
          <p className="text-brand-navy/70 mt-2 text-base font-light">
            Track and analyze your Google Business Profile reviews
          </p>
        </div>

        <div className="bg-sunset-orange/10 border-2 border-sunset-orange/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-sunset-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-sunset-orange" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2">Unable to Load Reviews</h2>
          <p className="text-brand-navy/70 mb-6 max-w-md mx-auto">
            {error}
          </p>
          {error.includes('location ID') && (
            <button
              onClick={() => router.push('/dashboard-client/settings')}
              className="inline-flex items-center px-6 py-3 bg-brand-gold text-brand-navy rounded-lg hover:bg-brand-gold/90 transition-colors font-semibold shadow-sm"
            >
              <SettingsIcon className="h-5 w-5 mr-2" />
              Configure Settings
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!reviewsData) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-brand-navy mb-2">Google Reviews</h1>
        <p className="text-brand-navy/70 mt-2 text-base font-light">
          Track and analyze your Google Business Profile reviews
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Total Reviews</span>
            <MessageSquare className="h-5 w-5 text-brand-gold" />
          </div>
          <div className="text-3xl font-bold text-brand-navy">
            {formatNumber(reviewsData.totalReviews)}
          </div>
          <p className="text-xs text-brand-navy/60 mt-1">All-time reviews</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Average Rating</span>
            <Star className="h-5 w-5 text-brand-gold fill-brand-gold" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-brand-navy">
              {reviewsData.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(reviewsData.averageRating))}
          </div>
          <p className="text-xs text-brand-navy/60 mt-1">Out of 5 stars</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {reviewsData.monthlyData && reviewsData.monthlyData.length > 0 && (
        <div className="bg-white rounded-xl border border-soft-gray shadow-sm">
          <div className="px-6 py-5 border-b border-soft-gray">
            <h3 className="text-lg font-bold text-brand-navy flex items-center">
              <TrendingUp className="h-5 w-5 text-brand-gold mr-2" />
              Monthly Review Summary
            </h3>
            <p className="text-sm text-brand-navy/60 mt-1">Reviews grouped by month</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-golden-cream/20 border-b border-soft-gray">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Review Count
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Average Rating
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {reviewsData.monthlyData.map((month, index) => (
                  <tr key={month.month} className="hover:bg-golden-cream/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-navy/40" />
                        <span className="text-sm font-semibold text-brand-navy">
                          {formatMonthYear(month.month)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-brand-navy">
                        {formatNumber(month.count)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-brand-gold">
                        {month.averageRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {renderStars(Math.round(month.averageRating))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {reviewsData.recentReviews && reviewsData.recentReviews.length > 0 && (
        <div className="bg-white rounded-xl border border-soft-gray shadow-sm">
          <div className="px-6 py-5 border-b border-soft-gray">
            <h3 className="text-lg font-bold text-brand-navy flex items-center">
              <MessageSquare className="h-5 w-5 text-brand-gold mr-2" />
              Recent Reviews
            </h3>
            <p className="text-sm text-brand-navy/60 mt-1">Latest customer feedback</p>
          </div>

          <div className="divide-y divide-soft-gray">
            {reviewsData.recentReviews.map((review, index) => (
              <div key={index} className="p-6 hover:bg-golden-cream/5 transition-colors">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{review.author}</p>
                    <p className="text-xs text-brand-navy/60 mt-0.5">{formatDate(review.createTime)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {renderStars(review.rating)}
                    <span className="text-xs font-semibold text-brand-navy">{review.rating}.0</span>
                  </div>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <div className="mb-3">
                    <p className="text-sm text-brand-navy/80 leading-relaxed font-light">
                      {review.comment}
                    </p>
                  </div>
                )}

                {/* Review Reply */}
                {review.reviewReply && (
                  <div className="mt-3 pl-4 border-l-2 border-brand-gold/30 bg-brand-gold/5 p-3 rounded-r-lg">
                    <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-1">
                      Your Response
                    </p>
                    <p className="text-sm text-brand-navy/70 leading-relaxed font-light">
                      {review.reviewReply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reviewsData.totalReviews === 0 && (
        <div className="bg-brand-gold/10 border-2 border-brand-gold/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-brand-navy" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2">No Reviews Yet</h2>
          <p className="text-brand-navy/70 max-w-md mx-auto">
            Your Google Business Profile doesn't have any reviews yet. Encourage your customers to leave reviews to build trust and improve your online presence.
          </p>
        </div>
      )}
    </div>
  )
}
