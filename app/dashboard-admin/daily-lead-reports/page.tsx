'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'
import { useApiUrl } from '@/lib/hooks/use-api-url'
import type { DailyLeadReport } from '@/types'

export default function DailyLeadReportsPage() {
  const [reports, setReports] = useState<DailyLeadReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<DailyLeadReport | null>(
    null
  )
  const [hotelName, setHotelName] = useState<string>('')
  const { selectedHotelId, isReady } = useSelectedHotelId()
  const buildUrl = useApiUrl()

  useEffect(() => {
    if (isReady) {
      fetchReports()
    }
  }, [selectedHotelId, isReady])

  async function fetchReports() {
    setLoading(true)
    try {
      const url = buildUrl('/api/admin/daily-lead-reports')
      const response = await fetch(url)
      const data = await response.json()

      setReports(data.reports || [])
      if (data.hotel) {
        setHotelName(data.hotel.name)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDeliveryStatusBadge(status: string) {
    switch (status) {
      case 'sent':
        return <Badge variant="success">Sent</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warning':
        return <Badge variant="warning">Warning</Badge>
      default:
        return <Badge variant="info">{severity}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Lead Reports</h1>
        <p className="text-gray-600 mt-2">
          View daily exception reports and lead statistics
        </p>
        {hotelName && (
          <p className="text-sm text-gray-500 mt-1">
            Showing reports for: <span className="font-semibold">{hotelName}</span>
          </p>
        )}
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading daily reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No daily reports found
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {new Date(report.report_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.report_summary}
                  </p>
                </div>
                {getDeliveryStatusBadge(report.delivery_status)}
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.total_leads}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {report.high_quality_leads}
                  </div>
                  <div className="text-xs text-gray-600">High Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.medium_quality_leads}
                  </div>
                  <div className="text-xs text-gray-600">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {report.low_quality_leads}
                  </div>
                  <div className="text-xs text-gray-600">Low Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {report.spam_leads}
                  </div>
                  <div className="text-xs text-gray-600">Spam</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {report.duplicate_leads}
                  </div>
                  <div className="text-xs text-gray-600">Duplicates</div>
                </div>
              </div>

              {/* Exceptions */}
              {report.exceptions && report.exceptions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">
                    Exceptions ({report.exception_count})
                  </h4>
                  <div className="space-y-2">
                    {report.exceptions.map((exception, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded ${
                          exception.severity === 'error'
                            ? 'bg-red-50 border-l-4 border-red-500'
                            : 'bg-yellow-50 border-l-4 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {exception.type}
                              {exception.count > 0 && (
                                <span className="ml-2 text-sm">
                                  ({exception.count})
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              {exception.details}
                            </div>
                          </div>
                          {getSeverityBadge(exception.severity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Details */}
              <div className="flex gap-2 text-sm text-gray-600">
                <div>
                  Sent to: {report.sent_to.join(', ')}
                </div>
                {report.sent_at && (
                  <div className="ml-auto">
                    {new Date(report.sent_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(report)}
                >
                  View Full Report
                </Button>
                {report.delivery_status === 'failed' && (
                  <Button variant="outline" size="sm">
                    Retry Send
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Report HTML Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">
                Report Preview -{' '}
                {new Date(selectedReport.report_date).toLocaleDateString()}
              </h2>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
            </div>

            {selectedReport.report_html ? (
              <div
                className="border rounded p-4"
                dangerouslySetInnerHTML={{
                  __html: selectedReport.report_html,
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No HTML report available
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
