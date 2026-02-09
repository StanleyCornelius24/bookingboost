'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'
import { useApiUrl } from '@/lib/hooks/use-api-url'
import { LeadDetailModal } from '@/components/LeadDetailModal'
import type { Lead } from '@/types'

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [hotelName, setHotelName] = useState<string>('')
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { selectedHotelId, isReady } = useSelectedHotelId()
  const buildUrl = useApiUrl()

  useEffect(() => {
    if (isReady) {
      fetchLeads()
    }
  }, [filter, selectedHotelId, isReady])

  async function fetchLeads() {
    setLoading(true)
    try {
      const additionalParams: Record<string, string> = {}
      if (filter === 'spam') additionalParams.is_spam = 'true'
      else if (filter === 'high') additionalParams.quality = 'high'
      else if (filter === 'medium') additionalParams.quality = 'medium'
      else if (filter === 'low') additionalParams.quality = 'low'

      const url = buildUrl('/api/admin/leads', additionalParams)
      const response = await fetch(url)
      const data = await response.json()

      setLeads(data.leads || [])
      setSummary(data.summary || {})
      if (data.hotel) {
        setHotelName(data.hotel.name)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  const handleUpdateLead = async (leadId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update lead')
      }

      // Refresh leads list
      await fetchLeads()

      // Update selected lead
      const data = await response.json()
      setSelectedLead(data.lead)
    } catch (error) {
      console.error('Failed to update lead:', error)
      alert('Failed to update lead. Please try again.')
      throw error
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }

      // Refresh leads list
      await fetchLeads()

      // Close modal
      setIsModalOpen(false)
      setSelectedLead(null)
    } catch (error) {
      console.error('Failed to delete lead:', error)
      alert('Failed to delete lead. Please try again.')
      throw error
    }
  }

  function getQualityBadge(category: string | null) {
    switch (category) {
      case 'high':
        return <Badge variant="success">High Quality</Badge>
      case 'medium':
        return <Badge variant="warning">Medium</Badge>
      case 'low':
        return <Badge variant="destructive">Low Quality</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'new':
        return <Badge variant="info">New</Badge>
      case 'contacted':
        return <Badge variant="warning">Contacted</Badge>
      case 'qualified':
        return <Badge variant="success">Qualified</Badge>
      case 'quote_sent':
        return <Badge variant="warning">Quote Sent</Badge>
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'converted':
        return <Badge variant="success">Converted</Badge>
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>
      case 'rejected':
        return <Badge variant="outline">Rejected</Badge>
      case 'no_response':
        return <Badge variant="outline">No Response</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  function formatCurrency(value: number) {
    if (!value || value === 0) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads Management</h1>
        <p className="text-gray-600 mt-2">
          Manage and review all form submissions from your hotel websites
        </p>
        {hotelName && (
          <p className="text-sm text-gray-500 mt-1">
            Showing leads for: <span className="font-semibold">{hotelName}</span>
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Leads</div>
            <div className="text-2xl font-semibold mt-2 text-slate-900">{summary.total}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">High Quality</div>
            <div className="text-2xl font-semibold mt-2 text-emerald-600">
              {summary.high_quality}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Spam Detected</div>
            <div className="text-2xl font-semibold mt-2 text-rose-600">
              {summary.spam}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Converted</div>
            <div className="text-2xl font-semibold mt-2 text-sky-600">
              {summary.converted}
            </div>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === null ? 'default' : 'outline'}
          onClick={() => setFilter(null)}
        >
          All Leads
        </Button>
        <Button
          variant={filter === 'high' ? 'default' : 'outline'}
          onClick={() => setFilter('high')}
        >
          High Quality
        </Button>
        <Button
          variant={filter === 'medium' ? 'default' : 'outline'}
          onClick={() => setFilter('medium')}
        >
          Medium Quality
        </Button>
        <Button
          variant={filter === 'low' ? 'default' : 'outline'}
          onClick={() => setFilter('low')}
        >
          Low Quality
        </Button>
        <Button
          variant={filter === 'spam' ? 'default' : 'outline'}
          onClick={() => setFilter('spam')}
        >
          Spam
        </Button>
      </div>

      {/* Leads Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Recent Leads ({leads.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leads found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: any) => (
                    <TableRow
                      key={lead.id}
                      onClick={() => handleLeadClick(lead)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div>{lead.name}</div>
                        {lead.nationality && (
                          <div className="text-xs text-gray-500">{lead.nationality}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {lead.website_configs?.website_name || lead.hotels?.name || hotelName || '-'}
                        </div>
                        {lead.interested_in && (
                          <div className="text-xs text-slate-500">Room: {lead.interested_in}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.email || '-'}</div>
                          {lead.phone && (
                            <div className="text-xs text-gray-500">{lead.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.arrival_date || lead.departure_date ? (
                          <div className="text-sm">
                            <div>{formatDate(lead.arrival_date)}</div>
                            <div className="text-xs text-gray-500">
                              to {formatDate(lead.departure_date)}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.adults > 0 || lead.children > 0 ? (
                          <div className="text-sm">
                            {lead.adults > 0 && <div>{lead.adults} adults</div>}
                            {lead.children > 0 && (
                              <div className="text-xs text-gray-500">
                                {lead.children} children
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(lead.lead_value)}</TableCell>
                      <TableCell>{getQualityBadge(lead.quality_category)}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lead.lead_source?.replace('_', ' ') || 'Form'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(lead.submitted_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedLead(null)
        }}
        onUpdate={handleUpdateLead}
        onDelete={handleDeleteLead}
      />
    </div>
  )
}
