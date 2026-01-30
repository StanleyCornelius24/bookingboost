'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { parse } from 'csv-parse/browser/esm/sync'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'

export default function UploadBookingsPage() {
  const { selectedHotelId } = useSelectedHotelId()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(null)

      // Preview the CSV
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const records = parse(text, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          })
          setPreview(records.slice(0, 5)) // Show first 5 rows
        } catch (err) {
          setError('Error parsing CSV file. Please check the format.')
        }
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use the API route that properly handles SiteMinder and NightsBridge formats
      const formData = new FormData()
      formData.append('file', file)
      if (selectedHotelId) {
        formData.append('hotelId', selectedHotelId)
      }

      const response = await fetch('/api/upload-bookings', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Build success message with breakdown
      let successMessage = `Successfully processed ${result.total} bookings:\n`
      successMessage += `• ${result.new} new bookings added\n`
      successMessage += `• ${result.updated} bookings updated\n`
      successMessage += `• ${result.skipped} duplicates skipped`

      if (result.newChannelsMessage) {
        successMessage += `\n\n${result.newChannelsMessage}`
      }

      setSuccess(successMessage)
      setFile(null)
      setPreview([])

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (err: any) {
      setError(err.message || 'Error uploading bookings')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `booking_date,checkin_date,checkout_date,channel,guest_name,revenue,nights,status
2024-01-15,2024-02-01,2024-02-05,Booking.com,John Doe,5000.00,4,confirmed
2024-01-16,2024-02-10,2024-02-12,Direct Booking,Jane Smith,3000.00,2,confirmed
2024-01-17,2024-02-15,2024-02-20,Expedia,Bob Johnson,8000.00,5,confirmed`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'booking_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Bookings</h1>
        <p className="mt-2 text-gray-600">Upload your booking data from a CSV file</p>
      </div>

      {/* Download Template */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Need a template?</h3>
            <p className="mt-1 text-sm text-blue-700">
              Download our CSV template to see the required format for your booking data.
            </p>
            <button
              onClick={downloadTemplate}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {file ? file.name : 'Drop your CSV file here, or click to browse'}
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">CSV files only, up to 10MB</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Preview (first 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-900">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {file && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Upload Bookings
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Supported Formats</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload CSV exports directly from your channel manager:
        </p>
        <ul className="text-sm text-gray-600 space-y-2 mb-4">
          <li className="flex items-start">
            <span className="font-medium mr-2">✓</span>
            <span><strong>SiteMinder:</strong> Exports with fields like "Channel", "Total price", "Check-in", "Booked-on date", etc.</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">✓</span>
            <span><strong>NightsBridge:</strong> Exports with fields like "Source", "Revenue", "Arrival Date", "Booking Date", etc.</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">✓</span>
            <span><strong>Custom Format:</strong> Download our template below for the standard format</span>
          </li>
        </ul>
        <p className="text-xs text-gray-500 italic">
          The system will automatically detect your CSV format and parse it correctly. Cancelled bookings are automatically filtered out.
        </p>
      </div>
    </div>
  )
}
