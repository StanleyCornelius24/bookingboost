import { Settings as SettingsIcon, Database, Shield, Bell, Mail } from 'lucide-react'

export default function SystemSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">Configure system-wide settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Database Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-gray-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Database Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Database URL</label>
                <input
                  type="text"
                  readOnly
                  value={process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Connection Status</label>
                <div className="mt-2 flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Row Level Security (RLS)</h3>
                  <p className="text-sm text-gray-500">Database access control enabled</p>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Enabled</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Verification</h3>
                  <p className="text-sm text-gray-500">Require email verification for new users</p>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Send system notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Provider</label>
                <input
                  type="text"
                  readOnly
                  value="Supabase (Default)"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Email</label>
                <input
                  type="email"
                  placeholder="noreply@bookingboost.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
