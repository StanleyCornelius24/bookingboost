import { createServerClient } from '@/lib/supabase/server'
import { Users as UsersIcon, Mail, Shield, Calendar } from 'lucide-react'

export default async function AllUsersPage() {
  const supabase = await createServerClient()

  // Fetch all users with their hotel information
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  // Count users by role
  const adminCount = hotels?.filter(h => h.user_role === 'admin').length || 0
  const agencyCount = hotels?.filter(h => h.user_role === 'agency').length || 0
  const clientCount = hotels?.filter(h => h.user_role === 'client').length || 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
        <p className="mt-2 text-gray-600">Manage all users in the system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{hotels?.length || 0}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{adminCount}</p>
            </div>
            <Shield className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agencies</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{agencyCount}</p>
            </div>
            <Shield className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{clientCount}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel/Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hotels?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        user.user_role === 'admin' ? 'bg-red-100' :
                        user.user_role === 'agency' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          user.user_role === 'admin' ? 'text-red-800' :
                          user.user_role === 'agency' ? 'text-yellow-800' : 'text-blue-800'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user.user_id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.user_role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user.user_role === 'agency'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.user_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!hotels || hotels.length === 0) && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">No users have been registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
