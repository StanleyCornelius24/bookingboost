#!/usr/bin/env node

/**
 * BookingBoost Client Onboarding Script
 *
 * Automates the process of adding a new client:
 * - Creates hotel record
 * - Creates website integration
 * - Generates API credentials
 * - Outputs setup instructions
 *
 * Usage:
 *   node scripts/onboard-client.mjs
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║   BookingBoost - Client Onboarding Wizard          ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  try {
    // Step 1: Get client information
    console.log('📋 Step 1: Client Information\n')

    const hotelName = await question('Hotel Name: ')
    const hotelEmail = await question('Contact Email: ')
    const hotelWebsite = await question('Website URL (e.g., https://example.com): ')
    const currency = await question('Currency (USD/ZAR/EUR/GBP) [default: USD]: ') || 'USD'

    console.log('\n')

    // Step 2: Get admin user
    console.log('👤 Step 2: Admin User\n')
    const adminEmail = await question('Admin Email (who owns this hotel): ')

    // Get admin user
    const { data: users } = await supabase.auth.admin.listUsers()
    const adminUser = users.users.find(u => u.email === adminEmail)

    if (!adminUser) {
      console.error(`\n❌ Error: User ${adminEmail} not found`)
      console.log('Please create this user account first, then try again.')
      rl.close()
      return
    }

    console.log(`✅ Found user: ${adminUser.email}`)

    // Step 3: Create hotel
    console.log('\n📍 Step 3: Creating Hotel Record...\n')

    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .insert({
        name: hotelName,
        email: hotelEmail,
        website: hotelWebsite,
        currency: currency.toUpperCase(),
        user_id: adminUser.id,
        user_role: 'client',
        is_primary: false,
        display_order: 1
      })
      .select()
      .single()

    if (hotelError) {
      console.error('❌ Error creating hotel:', hotelError)
      rl.close()
      return
    }

    console.log(`✅ Hotel created: ${hotel.name} (ID: ${hotel.id})`)

    // Step 4: Create website integration
    console.log('\n🔗 Step 4: Creating Website Integration...\n')

    // Generate API key
    const apiKey = 'bba_' + Array.from({ length: 32 }, () =>
      Math.random().toString(36)[2] || '0'
    ).join('')

    // Generate webhook secret
    const webhookSecret = Array.from({ length: 32 }, () =>
      Math.random().toString(36)[2] || '0'
    ).join('')

    const { data: integration, error: integrationError } = await supabase
      .from('website_configs')
      .insert({
        hotel_id: hotel.id,
        website_name: `${hotelName} - Main Site`,
        website_url: hotelWebsite,
        integration_type: 'gravity_forms',
        api_key: apiKey,
        webhook_secret: webhookSecret,
        status: 'active'
      })
      .select()
      .single()

    if (integrationError) {
      console.error('❌ Error creating integration:', integrationError)
      rl.close()
      return
    }

    console.log(`✅ Website integration created (ID: ${integration.id})`)

    // Step 5: Display setup instructions
    console.log('\n\n╔══════════════════════════════════════════════════════╗')
    console.log('║              ✅ SETUP COMPLETE!                      ║')
    console.log('╚══════════════════════════════════════════════════════╝\n')

    console.log('📊 Client Details:')
    console.log('─────────────────────────────────────────────────────')
    console.log(`Hotel Name:    ${hotel.name}`)
    console.log(`Hotel ID:      ${hotel.id}`)
    console.log(`Email:         ${hotel.email}`)
    console.log(`Website:       ${hotel.website}`)
    console.log(`Currency:      ${hotel.currency}`)
    console.log(`Owner:         ${adminEmail}`)
    console.log('')

    console.log('🔑 API Credentials (Share with client):')
    console.log('─────────────────────────────────────────────────────')
    console.log(`API Key:       ${apiKey}`)
    console.log(`Webhook URL:   https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook`)
    console.log(`Webhook Secret: ${webhookSecret}`)
    console.log('')

    console.log('📝 Next Steps for Client:')
    console.log('─────────────────────────────────────────────────────')
    console.log('1. Go to WordPress Admin → Forms → Settings → Webhooks')
    console.log('2. Click "Add New"')
    console.log('3. Configure the webhook:')
    console.log('   - Name: BookingBoost Lead Sync')
    console.log('   - Request URL: https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook')
    console.log('   - Method: POST')
    console.log('   - Format: JSON')
    console.log('   - Body: All Fields')
    console.log('4. Add Request Headers:')
    console.log(`   - X-API-Key: ${apiKey}`)
    console.log(`   - X-Webhook-Signature: ${webhookSecret}`)
    console.log('5. Save and test by submitting a form')
    console.log('')

    // Option to save to file
    const saveToFile = await question('💾 Save setup details to file? (y/n): ')

    if (saveToFile.toLowerCase() === 'y') {
      const fs = await import('fs')
      const filename = `client-setup-${hotelName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`

      const fileContent = `
BookingBoost - Client Setup Details
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════

CLIENT INFORMATION
──────────────────────────────────────────────────────
Hotel Name:    ${hotel.name}
Hotel ID:      ${hotel.id}
Email:         ${hotel.email}
Website:       ${hotel.website}
Currency:      ${hotel.currency}
Owner:         ${adminEmail}

API CREDENTIALS
──────────────────────────────────────────────────────
API Key:       ${apiKey}
Webhook URL:   https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook
Webhook Secret: ${webhookSecret}

WORDPRESS SETUP INSTRUCTIONS
──────────────────────────────────────────────────────
1. Log into WordPress Admin
2. Navigate to: Forms → Settings → Webhooks
3. Click "Add New"

4. Configure Webhook:
   Name:          BookingBoost Lead Sync
   Status:        Active
   Form:          [Select contact/booking form]

   Request URL:   https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook
   Method:        POST
   Format:        JSON
   Body:          All Fields

5. Add Headers:
   Header 1:
     Name:  X-API-Key
     Value: ${apiKey}

   Header 2:
     Name:  X-Webhook-Signature
     Value: ${webhookSecret}

6. Click "Save Settings"

7. Test by submitting a form on the website

8. Verify leads appear in BookingBoost dashboard:
   https://bookingboost.vercel.app/dashboard-admin/leads

═══════════════════════════════════════════════════════

SUPPORT
If you encounter issues, check:
- Gravity Forms webhook logs
- Ensure webhook status is "Active"
- Verify API key is copied correctly (no extra spaces)

Documentation: See PROPERTY_SETUP_GUIDE.md
`

      fs.writeFileSync(filename, fileContent)
      console.log(`✅ Setup details saved to: ${filename}`)
    }

    console.log('\n🎉 Client onboarding complete!\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    rl.close()
  }
}

main()
