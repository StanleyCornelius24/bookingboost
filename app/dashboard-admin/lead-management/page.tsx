import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LeadManagementPage() {
  const sections = [
    {
      title: 'Leads Management',
      description: 'View, filter, and manage all form submissions from your hotel websites. Track lead quality, status, and booking details.',
      href: '/dashboard-admin/leads',
      icon: '📋',
      features: [
        'Filter by quality (High/Medium/Low)',
        'View booking details and guest information',
        'Track lead status and conversion',
        'Summary statistics and metrics',
      ],
    },
    {
      title: 'Website Integrations',
      description: 'Configure Gravity Forms webhooks for your hotel websites. Manage API keys and webhook settings.',
      href: '/dashboard-admin/website-integrations',
      icon: '🔗',
      features: [
        'Add new website integrations',
        'Generate API keys and webhook secrets',
        'Configure daily report settings',
        'Monitor integration status',
      ],
    },
    {
      title: 'Daily Reports',
      description: 'View automated daily exception reports highlighting spam, duplicates, and quality issues.',
      href: '/dashboard-admin/daily-lead-reports',
      icon: '📊',
      features: [
        'View past daily reports',
        'Exception detection and alerts',
        'Statistics breakdown by quality',
        'Email delivery tracking',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lead Management System</h1>
        <p className="text-gray-600 mt-2">
          Manage form submissions, configure integrations, and view daily reports
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <Card key={section.href} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{section.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
                <p className="text-gray-600 mb-4">{section.description}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Features:</h3>
                  <ul className="space-y-1">
                    {section.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={section.href}>
                  <Button className="mt-2">
                    Go to {section.title}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-lg mb-2">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Webhook Endpoint</div>
            <div className="font-mono text-xs mt-1 break-all">
              /api/integrations/gravity-forms/webhook
            </div>
          </div>
          <div>
            <div className="text-gray-600">Features</div>
            <div className="font-semibold mt-1">
              Quality Scoring • Spam Detection • Daily Reports
            </div>
          </div>
          <div>
            <div className="text-gray-600">Documentation</div>
            <div className="mt-1">
              <a
                href="/docs/README.md"
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                View Setup Guide
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            <span>Go to <strong>Website Integrations</strong> to add your hotel websites and generate API keys</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            <span>Configure the webhook in your Gravity Forms settings with the API key</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">3.</span>
            <span>Submit a test form to verify the integration is working</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">4.</span>
            <span>View incoming leads in <strong>Leads Management</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">5.</span>
            <span>Check <strong>Daily Reports</strong> for automated exception alerts</span>
          </li>
        </ol>
      </Card>
    </div>
  )
}
