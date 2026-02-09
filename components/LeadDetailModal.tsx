'use client'

import { useState } from 'react'
import { X, Trash2, Save, Mail, Phone, Calendar, Users, MapPin, Tag, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface LeadDetailModalProps {
  lead: any
  isOpen: boolean
  onClose: () => void
  onUpdate: (leadId: string, updates: any) => Promise<void>
  onDelete: (leadId: string) => Promise<void>
}

export function LeadDetailModal({ lead, isOpen, onClose, onUpdate, onDelete }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editedLead, setEditedLead] = useState(lead)

  if (!isOpen || !lead) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(lead.id, editedLead)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(lead.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getQualityBadge = (category: string | null) => {
    switch (category) {
      case 'high':
        return <Badge variant="success">High Quality</Badge>
      case 'medium':
        return <Badge variant="warning">Medium Quality</Badge>
      case 'low':
        return <Badge variant="destructive">Low Quality</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="info">New</Badge>
      case 'contacted':
        return <Badge variant="warning">Contacted</Badge>
      case 'qualified':
        return <Badge variant="success">Qualified</Badge>
      case 'converted':
        return <Badge variant="success">Converted</Badge>
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Lead Details</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Submitted {formatDate(lead.submitted_at || lead.created_at)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Status and Quality */}
              <div className="flex gap-3 mb-6">
                {isEditing ? (
                  <select
                    value={editedLead.status}
                    onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value })}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="quote_sent">Quote Sent</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="converted">Converted</option>
                    <option value="declined">Declined</option>
                    <option value="spam">Spam</option>
                    <option value="rejected">Rejected</option>
                  </select>
                ) : (
                  getStatusBadge(lead.status)
                )}
                {getQualityBadge(lead.quality_category)}
                {lead.is_spam && <Badge variant="destructive">Spam Detected</Badge>}
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.name}
                        onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedLead.email || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.email || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedLead.phone || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Nationality
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.nationality || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, nationality: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.nationality || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Check-in Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedLead.arrival_date || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, arrival_date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{formatDate(lead.arrival_date)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Check-out Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedLead.departure_date || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, departure_date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{formatDate(lead.departure_date)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Users className="inline h-4 w-4 mr-1" />
                      Adults
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedLead.adults || 0}
                        onChange={(e) => setEditedLead({ ...editedLead, adults: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.adults || 0}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Users className="inline h-4 w-4 mr-1" />
                      Children
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedLead.children || 0}
                        onChange={(e) => setEditedLead({ ...editedLead, children: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.children || 0}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Room Type / Interest
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.interested_in || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, interested_in: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    ) : (
                      <p className="text-slate-900">{lead.interested_in || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Message</h3>
                {isEditing ? (
                  <textarea
                    value={editedLead.message || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                ) : (
                  <p className="text-slate-900 bg-slate-50 p-4 rounded-md whitespace-pre-wrap">
                    {lead.message || 'No message provided'}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Property</label>
                    <p className="text-slate-900">
                      {lead.website_configs?.website_name || lead.hotels?.name || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Lead Source</label>
                    <p className="text-slate-900 capitalize">
                      {lead.lead_source?.replace('_', ' ') || 'Form Submission'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Source URL</label>
                    <p className="text-slate-900 text-sm truncate" title={lead.source_url}>
                      {lead.source_url || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">IP Address</label>
                    <p className="text-slate-900">{lead.ip_address || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Quality Score</label>
                    <p className="text-slate-900">{lead.quality_score?.toFixed(2) || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Spam Score</label>
                    <p className="text-slate-900">{lead.spam_score?.toFixed(2) || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Lead'}
              </Button>

              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedLead(lead)
                        setIsEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Lead
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
