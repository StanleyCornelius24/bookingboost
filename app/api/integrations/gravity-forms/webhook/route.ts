import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  calculateQualityScore,
  calculateSpamScore,
  checkDuplicate,
  verifyWebhookSignature,
} from '@/lib/lead-utils'
import type { Lead, WebsiteConfig } from '@/types'

/**
 * Gravity Forms Webhook Endpoint
 *
 * Receives form submissions from 10-15 hotel websites
 * - Authenticates via X-API-Key header
 * - Optionally verifies HMAC signature
 * - Detects duplicates using composite key
 * - Calculates quality and spam scores
 * - Stores lead with all metadata
 *
 * POST /api/integrations/gravity-forms/webhook
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    // =====================================================
    // 1. AUTHENTICATION - Verify API Key
    // =====================================================
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing X-API-Key header' },
        { status: 401 }
      )
    }

    // Fetch website config by API key
    const { data: websiteConfig, error: configError } = await supabase
      .from('website_configs')
      .select('*')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .single()

    if (configError || !websiteConfig) {
      console.error('Invalid API key:', apiKey.substring(0, 10) + '...')
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive API key' },
        { status: 401 }
      )
    }

    const config = websiteConfig as WebsiteConfig

    // =====================================================
    // 2. WEBHOOK SIGNATURE VERIFICATION (Optional)
    // =====================================================
    if (config.webhook_secret) {
      const signature = request.headers.get('x-webhook-signature')
      const rawBody = await request.text()

      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing webhook signature' },
          { status: 401 }
        )
      }

      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        config.webhook_secret
      )

      if (!isValid) {
        console.error('Invalid webhook signature for:', config.website_name)
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }

      // Parse JSON after verification
      const payload = JSON.parse(rawBody)
      return processWebhook(supabase, config, payload)
    }

    // No signature verification - parse directly
    const payload = await request.json()
    return processWebhook(supabase, config, payload)
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Process the webhook payload
 */
async function processWebhook(
  supabase: any,
  config: WebsiteConfig,
  payload: any
) {
  try {
    // =====================================================
    // 3. EXTRACT LEAD DATA from Gravity Forms Payload
    // =====================================================
    // Gravity Forms webhook payload structure:
    // {
    //   form_id: "1",
    //   form_title: "Contact Form",
    //   entry_id: "42",
    //   fields: {
    //     "1": "John Doe",
    //     "2": "john@example.com",
    //     "3": "(555) 123-4567",
    //     "4": "I would like to book a room...",
    //     ...
    //   },
    //   source_url: "https://hotel.com/contact",
    //   created_by: "1",
    //   date_created: "2024-01-15 10:30:00",
    //   ip: "192.168.1.1",
    //   user_agent: "Mozilla/5.0...",
    //   ...
    // }

    const formId = payload.form_id || payload.id || 'unknown'
    const entryId = payload.entry_id || payload.entry?.id || String(Date.now())
    const formTitle = payload.form_title || payload.title || 'Contact Form'

    // Extract fields (Gravity Forms uses numeric field IDs)
    // Fields can be in payload.fields, payload.entry, or directly in payload root
    const fields = payload.fields || payload.entry || payload

    // Try to intelligently extract common fields
    // This is a best-effort extraction - adjust based on actual Gravity Forms setup
    let name: string = ''
    let email: string | null = null
    let phone: string | null = null
    let message: string = ''
    let enquiryDate: string | null = null
    let bookedDate: string | null = null
    let arrivalDate: string | null = null
    let departureDate: string | null = null
    let adults: number = 0
    let children: number = 0
    let interestedIn: string | null = null
    let nationality: string | null = null
    let leadValue: number = 0
    let leadSource: string = 'form_submission'

    // System/metadata fields to skip (Gravity Forms built-in fields)
    const systemFields = new Set([
      'id', 'form_id', 'post_id', 'date_created', 'date_updated', 'is_starred',
      'is_read', 'ip', 'source_url', 'user_agent', 'currency', 'payment_status',
      'payment_date', 'payment_amount', 'payment_method', 'transaction_id',
      'is_fulfilled', 'created_by', 'transaction_type', 'status', 'source_id',
      'submission_speeds', 'entry_id', 'form_title'
    ])

    // Strategy: Look for field values that match expected patterns
    Object.entries(fields).forEach(([key, value]: [string, any]) => {
      // Skip system/metadata fields
      if (systemFields.has(key)) return

      const fieldValue = typeof value === 'object' ? value.value : value
      const fieldValueStr = String(fieldValue || '').trim()
      const fieldLabel = (typeof value === 'object' ? value.label : '') || ''
      const fieldLabelLower = fieldLabel.toLowerCase()

      if (!fieldValueStr) return

      // Email detection
      if (
        fieldValueStr.includes('@') &&
        !email &&
        fieldValueStr.length < 100
      ) {
        email = fieldValueStr
      }
      // Phone detection (contains digits and phone-like characters)
      else if (
        /[\d\-\(\)\+\s]{10,}/.test(fieldValueStr) &&
        !phone &&
        fieldValueStr.length < 30
      ) {
        phone = fieldValueStr
      }
      // Name detection (short text without @ or excessive punctuation)
      else if (
        !name &&
        fieldValueStr.length > 2 &&
        fieldValueStr.length < 100 &&
        !fieldValueStr.includes('@') &&
        /^[a-zA-Z\s\-'\.]+$/.test(fieldValueStr)
      ) {
        name = fieldValueStr
      }
      // Date detection - arrival/check-in
      else if (
        !arrivalDate &&
        (fieldLabelLower.includes('arrival') ||
          fieldLabelLower.includes('check-in') ||
          fieldLabelLower.includes('check in') ||
          fieldLabelLower.includes('from date'))
      ) {
        arrivalDate = fieldValueStr
      }
      // Date detection - departure/check-out
      else if (
        !departureDate &&
        (fieldLabelLower.includes('departure') ||
          fieldLabelLower.includes('check-out') ||
          fieldLabelLower.includes('check out') ||
          fieldLabelLower.includes('to date'))
      ) {
        departureDate = fieldValueStr
      }
      // Date detection - enquiry date
      else if (
        !enquiryDate &&
        (fieldLabelLower.includes('enquiry date') ||
          fieldLabelLower.includes('inquiry date'))
      ) {
        enquiryDate = fieldValueStr
      }
      // Date detection - booked date
      else if (
        !bookedDate &&
        (fieldLabelLower.includes('booked date') ||
          fieldLabelLower.includes('booking date') ||
          fieldLabelLower.includes('confirmed date'))
      ) {
        bookedDate = fieldValueStr
      }
      // Number detection - adults
      else if (
        adults === 0 &&
        (fieldLabelLower.includes('adults') ||
          fieldLabelLower.includes('adult')) &&
        !isNaN(parseInt(fieldValueStr))
      ) {
        adults = parseInt(fieldValueStr)
      }
      // Number detection - children
      else if (
        children === 0 &&
        (fieldLabelLower.includes('children') ||
          fieldLabelLower.includes('child') ||
          fieldLabelLower.includes('kids')) &&
        !isNaN(parseInt(fieldValueStr))
      ) {
        children = parseInt(fieldValueStr)
      }
      // Interested in - room type, package, etc.
      else if (
        !interestedIn &&
        (fieldLabelLower.includes('interested in') ||
          fieldLabelLower.includes('room type') ||
          fieldLabelLower.includes('package') ||
          fieldLabelLower.includes('accommodation'))
      ) {
        interestedIn = fieldValueStr
      }
      // Nationality
      else if (
        !nationality &&
        (fieldLabelLower.includes('nationality') ||
          fieldLabelLower.includes('country'))
      ) {
        nationality = fieldValueStr
      }
      // Lead value
      else if (
        leadValue === 0 &&
        (fieldLabelLower.includes('budget') ||
          fieldLabelLower.includes('value') ||
          fieldLabelLower.includes('amount'))
      ) {
        // Try to extract numeric value
        const numericValue = fieldValueStr.replace(/[^\d.]/g, '')
        if (!isNaN(parseFloat(numericValue))) {
          leadValue = parseFloat(numericValue)
        }
      }
      // Message detection (longer text)
      else if (fieldValueStr.length > 20 && !message) {
        message = fieldValueStr
      }
    })

    // Fallback: if message is empty, use longest field value
    if (!message) {
      const allValues = Object.values(fields)
        .map((v: any) => (typeof v === 'object' ? v.value : v))
        .filter((v) => v && String(v).trim().length > 0)
        .map((v) => String(v).trim())

      message = allValues.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      , '')
    }

    // Validation
    if (!name) {
      name = email || phone || 'Anonymous'
    }

    // If no message, create one from booking details
    if (!message || message.length < 5) {
      const parts = []
      if (interestedIn) parts.push(`Room: ${interestedIn}`)
      if (arrivalDate) parts.push(`Check-in: ${arrivalDate}`)
      if (departureDate) parts.push(`Check-out: ${departureDate}`)
      if (adults) parts.push(`${adults} adult${adults > 1 ? 's' : ''}`)
      if (children) parts.push(`${children} child${children !== 1 ? 'ren' : ''}`)

      message = parts.length > 0
        ? `Booking enquiry - ${parts.join(', ')}`
        : 'New booking enquiry from contact form'
    }

    // Determine lead source from payload
    if (payload.source_type === 'email') {
      leadSource = 'direct_email'
    } else if (payload.source_type === 'chat') {
      leadSource = 'live_chat'
    }

    // =====================================================
    // 4. CHECK FOR DUPLICATES (Composite Key)
    // =====================================================
    const leadData: Partial<Lead> = {
      hotel_id: config.hotel_id,
      website_config_id: config.id,
      name,
      email,
      phone,
      message,

      // Booking details
      enquiry_date: enquiryDate,
      booked_date: bookedDate,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      adults,
      children,
      interested_in: interestedIn,
      nationality,
      lead_value: leadValue,
      lead_source: leadSource as any,

      // Form tracking
      form_id: formId,
      form_title: formTitle,
      entry_id: entryId,
      submitted_at: payload.date_created || new Date().toISOString(),

      // Source tracking
      source_url: payload.source_url || null,
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      referrer: payload.referrer || null,
      ip_address: payload.ip || null,
      webhook_payload: payload,
    }

    const duplicateCheck = await checkDuplicate(
      leadData,
      config.id,
      supabase
    )

    if (duplicateCheck.isDuplicate) {
      console.log(
        `Duplicate lead detected: ${config.id}:${formId}:${entryId}`
      )
      return NextResponse.json(
        {
          success: true,
          isDuplicate: true,
          leadId: duplicateCheck.existingLeadId,
          composite_key: `${config.id}:${formId}:${entryId}`,
          message: 'Lead already exists',
        },
        { status: 200 }
      )
    }

    // =====================================================
    // 5. CALCULATE QUALITY SCORE
    // =====================================================
    const qualityResult = await calculateQualityScore(leadData, supabase)

    leadData.quality_score = qualityResult.score
    leadData.quality_category = qualityResult.category
    leadData.quality_reasons = qualityResult.reasons

    // =====================================================
    // 6. CALCULATE SPAM SCORE
    // =====================================================
    const spamResult = await calculateSpamScore(
      leadData,
      config.hotel_id,
      supabase
    )

    leadData.spam_score = spamResult.score
    leadData.spam_flags = spamResult.flags
    leadData.is_spam = spamResult.isSpam

    // Auto-set status based on spam detection
    leadData.status = spamResult.isSpam ? 'spam' : 'new'

    // =====================================================
    // 7. STORE LEAD IN DATABASE
    // =====================================================
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (insertError) {
      console.error('Lead insertion error:', insertError)

      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate lead detected',
            composite_key: `${config.id}:${formId}:${entryId}`,
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to store lead', details: insertError.message },
        { status: 500 }
      )
    }

    // =====================================================
    // 8. RECORD STATUS CHANGE (Audit Trail)
    // =====================================================
    await supabase.from('lead_status_changes').insert([
      {
        lead_id: insertedLead.id,
        field_changed: 'status',
        old_value: null,
        new_value: leadData.status,
        changed_by: null, // System
        change_reason: 'Initial submission',
      },
    ])

    // =====================================================
    // 9. UPDATE WEBSITE CONFIG LAST SYNC
    // =====================================================
    await supabase
      .from('website_configs')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', config.id)

    // =====================================================
    // 10. RETURN SUCCESS RESPONSE
    // =====================================================
    console.log(
      `Lead created: ${insertedLead.id} | Quality: ${qualityResult.category} (${qualityResult.score.toFixed(2)}) | Spam: ${spamResult.isSpam ? 'YES' : 'NO'} (${spamResult.score.toFixed(2)})`
    )

    return NextResponse.json(
      {
        success: true,
        leadId: insertedLead.id,
        isDuplicate: false,
        composite_key: `${config.id}:${formId}:${entryId}`,
        quality: qualityResult.category,
        qualityScore: qualityResult.score,
        isSpam: spamResult.isSpam,
        spamScore: spamResult.score,
        status: leadData.status,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Processing failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 * GET /api/integrations/gravity-forms/webhook
 */
export async function GET() {
  return NextResponse.json({
    service: 'Gravity Forms Webhook Handler',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}
