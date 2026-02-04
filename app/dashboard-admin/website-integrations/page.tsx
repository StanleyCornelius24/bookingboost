'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'
import { useApiUrl } from '@/lib/hooks/use-api-url'
import type { WebsiteConfig } from '@/types'

export default function WebsiteIntegrationsPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [newConfig, setNewConfig] = useState<any>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    setLoading(true)
    try {
      // Fetch all integrations across all hotels (admin view)
      const response = await fetch('/api/admin/website-configs/all')
      const data = await response.json()

      console.log('[Frontend] API Response:', data)
      console.log('[Frontend] Configs:', data.configs)
      console.log('[Frontend] Configs length:', data.configs?.length)

      setConfigs(data.configs || [])
    } catch (error) {
      console.error('Failed to fetch website configs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateConfig(formData: any) {
    try {
      // Don't use buildUrl for POST - hotelId comes from the body, not query params
      const response = await fetch('/api/admin/website-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          generate_secret: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store config with hotel name for success message
        setNewConfig({
          ...data.config,
          createdForHotel: formData.hotelName
        })
        // Refresh the list to show the new integration
        fetchConfigs()
      } else {
        alert('Failed to create website config: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to create config:', error)
      alert('Failed to create website config')
    }
  }

  async function handleUpdateConfig(configId: string, formData: any) {
    try {
      const response = await fetch('/api/admin/website-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Settings updated successfully!')
        setShowSettingsDialog(false)
        setSelectedConfig(null)
        fetchConfigs()
      } else {
        alert('Failed to update settings: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      alert('Failed to update settings')
    }
  }

  async function handleDeactivate(configId: string) {
    if (!confirm('Are you sure you want to deactivate this integration?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/website-configs?configId=${configId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Integration deactivated successfully')
        fetchConfigs()
      } else {
        alert('Failed to deactivate integration: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to deactivate config:', error)
      alert('Failed to deactivate integration')
    }
  }

  async function handleDelete(configId: string) {
    if (!confirm('Are you sure you want to permanently delete this integration? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/website-configs?configId=${configId}&permanent=true`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Integration deleted successfully')
        fetchConfigs()
      } else {
        alert('Failed to delete integration: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to delete config:', error)
      alert('Failed to delete integration')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>
      case 'testing':
        return <Badge variant="warning">Testing</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Website Integrations</h1>
          <p className="text-gray-600 mt-2">
            Configure Gravity Forms webhooks for your hotel websites
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Showing all integrations across all hotels ({configs.length} total)
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          Add Website
        </Button>
      </div>

      {/* New Config Success Dialog */}
      {newConfig && (
        <Card className="bg-green-50 border-green-200 p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Website Integration Created Successfully!
          </h3>
          {newConfig.createdForHotel && (
            <p className="text-sm text-green-800 mb-2">
              Created for: <span className="font-semibold">{newConfig.createdForHotel}</span>
            </p>
          )}
          <p className="text-sm text-green-800 mb-4">
            Copy these credentials now - they will only be shown once:
          </p>

          <div className="space-y-4">
            <div>
              <Label className="text-green-900">API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newConfig.api_key}
                  readOnly
                  className="font-mono text-sm bg-white"
                />
                <Button
                  onClick={() => copyToClipboard(newConfig.api_key)}
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
            </div>

            {newConfig.webhook_secret && (
              <div>
                <Label className="text-green-900">Webhook Secret</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newConfig.webhook_secret}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    onClick={() => copyToClipboard(newConfig.webhook_secret)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label className="text-green-900">Webhook URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value="https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook"
                  readOnly
                  className="font-mono text-sm bg-white"
                />
                <Button
                  onClick={() =>
                    copyToClipboard(
                      'https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook'
                    )
                  }
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={() => setNewConfig(null)} variant="outline">
              Close
            </Button>
          </div>
        </Card>
      )}

      {/* Website Configs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading website integrations...
          </div>
        ) : configs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No website integrations configured yet. Click "Add Website" to create your first integration.
          </div>
        ) : (
          configs.map((config) => (
            <Card key={config.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {config.hotel_name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {config.website_url}
                  </p>
                </div>
                {getStatusBadge(config.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">API Key:</span>
                  <div className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded">
                    {config.api_key_preview}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600">Forms:</span>
                  <div className="mt-1">
                    {config.form_ids?.length > 0
                      ? config.form_ids.join(', ')
                      : 'No forms configured'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600">Last Sync:</span>
                  <div className="mt-1">
                    {config.last_sync_at
                      ? new Date(config.last_sync_at).toLocaleString()
                      : 'Never'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600">Daily Reports:</span>
                  <div className="mt-1">
                    {config.daily_report_enabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedConfig(config)
                    setShowSettingsDialog(true)
                  }}
                >
                  Settings
                </Button>
                {config.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeactivate(config.id)}
                  >
                    Deactivate
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(config.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Website Dialog */}
      {showAddDialog && (
        <AddWebsiteDialog
          onClose={() => setShowAddDialog(false)}
          onCreate={handleCreateConfig}
        />
      )}

      {/* Settings Dialog */}
      {showSettingsDialog && selectedConfig && (
        <SettingsDialog
          config={selectedConfig}
          onClose={() => {
            setShowSettingsDialog(false)
            setSelectedConfig(null)
          }}
          onUpdate={handleUpdateConfig}
        />
      )}
    </div>
  )
}

function SettingsDialog({
  config,
  onClose,
  onUpdate,
}: {
  config: any
  onClose: () => void
  onUpdate: (configId: string, data: any) => void
}) {
  const [formData, setFormData] = useState({
    website_name: config.website_name || '',
    website_url: config.website_url || '',
    form_ids: Array.isArray(config.form_ids) ? config.form_ids.join(', ') : '',
    daily_report_email: Array.isArray(config.daily_report_email)
      ? config.daily_report_email.join(', ')
      : '',
    daily_report_enabled: config.daily_report_enabled ?? true,
    status: config.status || 'active',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const data = {
      website_name: formData.website_name,
      website_url: formData.website_url,
      form_ids: formData.form_ids.split(',').map((id: string) => id.trim()).filter(Boolean),
      daily_report_email: formData.daily_report_email
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean),
      daily_report_enabled: formData.daily_report_enabled,
      status: formData.status,
    }

    onUpdate(config.id, data)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">Integration Settings</h2>
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-600">Hotel</div>
          <div className="font-semibold">{config.hotel_name}</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="website_name">Website Name</Label>
            <Input
              id="website_name"
              value={formData.website_name}
              onChange={(e) =>
                setFormData({ ...formData, website_name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="form_ids">Form IDs (comma-separated)</Label>
            <Input
              id="form_ids"
              value={formData.form_ids}
              onChange={(e) =>
                setFormData({ ...formData, form_ids: e.target.value })
              }
              placeholder="1, 2, 3"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="testing">Testing</option>
            </select>
          </div>

          <div>
            <Label htmlFor="daily_report_email">Daily Report Email(s)</Label>
            <Input
              id="daily_report_email"
              type="email"
              value={formData.daily_report_email}
              onChange={(e) =>
                setFormData({ ...formData, daily_report_email: e.target.value })
              }
              placeholder="admin@hotel.com, manager@hotel.com"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="daily_report_enabled"
              checked={formData.daily_report_enabled}
              onChange={(e) =>
                setFormData({ ...formData, daily_report_enabled: e.target.checked })
              }
              className="w-4 h-4"
            />
            <Label htmlFor="daily_report_enabled">Enable Daily Reports</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function AddWebsiteDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [hotels, setHotels] = useState<any[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>('')
  const [selectedHotelName, setSelectedHotelName] = useState<string>('')
  const [formData, setFormData] = useState({
    website_name: '',
    website_url: '',
    form_ids: '',
    daily_report_email: '',
  })

  useEffect(() => {
    fetchHotels()
  }, [])

  async function fetchHotels() {
    try {
      // Admin endpoint returns all hotels in the system
      const response = await fetch('/api/admin/hotels')
      const data = await response.json()
      setHotels(data.hotels || [])
    } catch (error) {
      console.error('Failed to fetch hotels:', error)
    }
  }

  function handleHotelSelect(hotelId: string) {
    setSelectedHotelId(hotelId)
    const hotel = hotels.find(h => h.id === hotelId)
    if (hotel) {
      setSelectedHotelName(hotel.name)
      setFormData({
        ...formData,
        website_name: hotel.name,
        website_url: hotel.website || '',
        daily_report_email: hotel.email || '',
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedHotelId) {
      alert('Please select a hotel')
      return
    }

    const data = {
      ...formData,
      hotelId: selectedHotelId,
      hotelName: selectedHotelName, // Include hotel name for success message
      form_ids: formData.form_ids.split(',').map((id: string) => id.trim()).filter(Boolean),
      daily_report_email: formData.daily_report_email
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean),
    }

    onCreate(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">Add Website Integration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="hotel_select">Select Hotel</Label>
            <select
              id="hotel_select"
              value={selectedHotelId}
              onChange={(e) => handleHotelSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select a Hotel --</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This will auto-populate the website details below
            </p>
          </div>

          <div>
            <Label htmlFor="website_name">Website Name</Label>
            <Input
              id="website_name"
              value={formData.website_name}
              onChange={(e) =>
                setFormData({ ...formData, website_name: e.target.value })
              }
              placeholder="My Hotel Website"
              required
            />
          </div>

          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              placeholder="https://myhotel.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="form_ids">
              Form IDs (comma-separated, optional)
            </Label>
            <Input
              id="form_ids"
              value={formData.form_ids}
              onChange={(e) =>
                setFormData({ ...formData, form_ids: e.target.value })
              }
              placeholder="1, 2, 3"
            />
          </div>

          <div>
            <Label htmlFor="daily_report_email">
              Daily Report Email(s) (comma-separated)
            </Label>
            <Input
              id="daily_report_email"
              type="email"
              value={formData.daily_report_email}
              onChange={(e) =>
                setFormData({ ...formData, daily_report_email: e.target.value })
              }
              placeholder="admin@myhotel.com"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Integration
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
