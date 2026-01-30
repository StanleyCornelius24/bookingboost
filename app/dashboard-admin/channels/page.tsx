'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Merge, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Channel {
  channel: string
  bookingCount: number
}

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())

  // Merge state
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergeOldChannel, setMergeOldChannel] = useState('')
  const [mergeNewChannel, setMergeNewChannel] = useState('')
  const [merging, setMerging] = useState(false)
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null)
  const [mergeError, setMergeError] = useState<string | null>(null)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteChannel, setDeleteChannel] = useState<Channel | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Bulk delete state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0 })
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetchChannels()
  }, [])

  async function fetchChannels() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/channels')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to fetch channels (${response.status})`)
      }

      const data = await response.json()
      setChannels(data.channels || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels')
    } finally {
      setLoading(false)
    }
  }

  async function handleMerge() {
    if (!mergeOldChannel || !mergeNewChannel) {
      setMergeError('Both channel names are required')
      return
    }

    if (mergeOldChannel === mergeNewChannel) {
      setMergeError('Old and new channel names must be different')
      return
    }

    try {
      setMerging(true)
      setMergeError(null)

      const response = await fetch('/api/admin/channels/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldChannelName: mergeOldChannel,
          newChannelName: mergeNewChannel
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge channels')
      }

      setMergeSuccess(data.message)
      setMergeOldChannel('')
      setMergeNewChannel('')

      // Refresh channels list
      await fetchChannels()

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowMergeModal(false)
        setMergeSuccess(null)
      }, 2000)
    } catch (err) {
      setMergeError(err instanceof Error ? err.message : 'Failed to merge channels')
    } finally {
      setMerging(false)
    }
  }

  async function handleDelete() {
    if (!deleteChannel) return

    if (deleteConfirmation !== deleteChannel.channel) {
      setDeleteError('Channel name does not match')
      return
    }

    try {
      setDeleting(true)
      setDeleteError(null)

      const response = await fetch(
        `/api/admin/channels/delete?channelName=${encodeURIComponent(deleteChannel.channel)}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete channel')
      }

      setDeleteSuccess(data.message)
      setDeleteConfirmation('')

      // Refresh channels list
      await fetchChannels()

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowDeleteModal(false)
        setDeleteChannel(null)
        setDeleteSuccess(null)
      }, 2000)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete channel')
    } finally {
      setDeleting(false)
    }
  }

  function openMergeModal(channel: string) {
    setMergeOldChannel(channel)
    setMergeNewChannel('')
    setMergeError(null)
    setMergeSuccess(null)
    setShowMergeModal(true)
  }

  function openDeleteModal(channel: Channel) {
    setDeleteChannel(channel)
    setDeleteConfirmation('')
    setDeleteError(null)
    setDeleteSuccess(null)
    setShowDeleteModal(true)
  }

  function toggleChannelSelection(channelName: string) {
    const newSelection = new Set(selectedChannels)
    if (newSelection.has(channelName)) {
      newSelection.delete(channelName)
    } else {
      newSelection.add(channelName)
    }
    setSelectedChannels(newSelection)
  }

  function toggleSelectAll() {
    if (selectedChannels.size === channels.length) {
      setSelectedChannels(new Set())
    } else {
      setSelectedChannels(new Set(channels.map(c => c.channel)))
    }
  }

  async function handleBulkDelete() {
    if (selectedChannels.size === 0) return

    try {
      setBulkDeleting(true)
      setBulkDeleteError(null)
      setBulkDeleteProgress({ current: 0, total: selectedChannels.size })

      let current = 0
      for (const channelName of selectedChannels) {
        const response = await fetch(
          `/api/admin/channels/delete?channelName=${encodeURIComponent(channelName)}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to delete ${channelName}`)
        }

        current++
        setBulkDeleteProgress({ current, total: selectedChannels.size })
      }

      // Refresh channels list
      await fetchChannels()
      setSelectedChannels(new Set())

      setTimeout(() => {
        setShowBulkDeleteModal(false)
        setBulkDeleteProgress({ current: 0, total: 0 })
      }, 1500)
    } catch (err) {
      setBulkDeleteError(err instanceof Error ? err.message : 'Failed to delete channels')
    } finally {
      setBulkDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Channel Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage channels across all hotels. Merge similar channels or delete irrelevant ones.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Channels</CardTitle>
              <CardDescription>
                {channels.length} unique channels found across all hotels
                {selectedChannels.size > 0 && ` (${selectedChannels.size} selected)`}
              </CardDescription>
            </div>
            {selectedChannels.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedChannels.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {channels.length > 0 && (
              <div className="flex items-center p-3 border rounded-lg bg-muted/30">
                <input
                  type="checkbox"
                  checked={selectedChannels.size === channels.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 mr-3"
                />
                <p className="font-medium">Select All</p>
              </div>
            )}
            {channels.map((channel) => (
              <div
                key={channel.channel}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={selectedChannels.has(channel.channel)}
                    onChange={() => toggleChannelSelection(channel.channel)}
                    className="h-4 w-4 mr-3"
                  />
                  <div>
                    <p className="font-medium">{channel.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      {channel.bookingCount} booking{channel.bookingCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMergeModal(channel.channel)}
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    Merge
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteModal(channel)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Merge Modal */}
      <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Channel</DialogTitle>
            <DialogDescription>
              Rename or merge this channel with another. All bookings will be updated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Old Channel Name</Label>
              <Input
                value={mergeOldChannel}
                onChange={(e) => setMergeOldChannel(e.target.value)}
                placeholder="e.g., Booking.com"
              />
            </div>

            <div>
              <Label>New Channel Name</Label>
              <Input
                value={mergeNewChannel}
                onChange={(e) => setMergeNewChannel(e.target.value)}
                placeholder="e.g., booking.com"
                list="channel-suggestions"
              />
              <datalist id="channel-suggestions">
                {channels.map((ch) => (
                  <option key={ch.channel} value={ch.channel} />
                ))}
              </datalist>
              <p className="text-sm text-muted-foreground mt-1">
                Tip: Start typing to see existing channels
              </p>
            </div>

            {mergeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{mergeError}</AlertDescription>
              </Alert>
            )}

            {mergeSuccess && (
              <Alert>
                <AlertDescription>{mergeSuccess}</AlertDescription>
              </Alert>
            )}

            {mergeOldChannel && mergeNewChannel && mergeOldChannel !== mergeNewChannel && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will rename all bookings from "{mergeOldChannel}" to "{mergeNewChannel}" across all hotels.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMergeModal(false)}
              disabled={merging}
            >
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={merging}>
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4 mr-2" />
                  Merge Channels
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription>
              This will permanently delete all bookings from this channel across all hotels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {deleteChannel && (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are about to delete <strong>{deleteChannel.bookingCount}</strong> booking
                    {deleteChannel.bookingCount !== 1 ? 's' : ''} from channel "
                    <strong>{deleteChannel.channel}</strong>". This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Type the channel name to confirm</Label>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={deleteChannel.channel}
                  />
                </div>

                {deleteError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}

                {deleteSuccess && (
                  <Alert>
                    <AlertDescription>{deleteSuccess}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || deleteConfirmation !== deleteChannel?.channel}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Channel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Modal */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Channels</DialogTitle>
            <DialogDescription>
              This will permanently delete all bookings from the selected channels across all hotels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete <strong>{selectedChannels.size}</strong> channel
                {selectedChannels.size !== 1 ? 's' : ''} and all their bookings. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="max-h-40 overflow-y-auto border rounded p-2">
              <p className="text-sm font-medium mb-2">Selected channels:</p>
              <ul className="text-sm space-y-1">
                {Array.from(selectedChannels).map(channelName => {
                  const channel = channels.find(c => c.channel === channelName)
                  return (
                    <li key={channelName} className="flex justify-between">
                      <span>{channelName}</span>
                      <span className="text-muted-foreground">
                        {channel?.bookingCount} booking{channel?.bookingCount !== 1 ? 's' : ''}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {bulkDeleting && (
              <div>
                <p className="text-sm mb-2">
                  Deleting {bulkDeleteProgress.current} of {bulkDeleteProgress.total} channels...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(bulkDeleteProgress.current / bulkDeleteProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {bulkDeleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{bulkDeleteError}</AlertDescription>
              </Alert>
            )}

            {!bulkDeleting && bulkDeleteProgress.current === bulkDeleteProgress.total && bulkDeleteProgress.total > 0 && (
              <Alert>
                <AlertDescription>
                  Successfully deleted {bulkDeleteProgress.total} channel{bulkDeleteProgress.total !== 1 ? 's' : ''}!
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteModal(false)}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedChannels.size} Channel{selectedChannels.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
