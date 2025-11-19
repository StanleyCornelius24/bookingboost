import { requireUserRole } from '@/lib/get-user-role'

export default async function AgencyDashboardPage() {
  const { role, hotel } = await requireUserRole()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Advanced analytics and detailed insights for {hotel.name}
        </p>
      </div>

      {/* Temporary placeholder content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Analytics</h3>
          <p className="text-gray-600">Detailed revenue breakdown and trends</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Channel Performance</h3>
          <p className="text-gray-600">Advanced channel analysis and optimization</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing ROI</h3>
          <p className="text-gray-600">Comprehensive marketing performance metrics</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-blue-800">
          <strong>Agency Mode:</strong> You're viewing the advanced dashboard with detailed analytics and reporting capabilities.
        </p>
      </div>
    </div>
  )
}