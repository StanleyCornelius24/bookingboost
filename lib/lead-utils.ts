import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type {
  Lead,
  QualityScoreResult,
  SpamScoreResult,
  DuplicateCheckResult,
  SpamDetectionRule,
  ReportStats,
  WebsiteInfo,
  Exception,
} from '@/types'

// =====================================================
// EMAIL VALIDATION
// =====================================================

/**
 * Validates email address format using RFC 5322 standard
 * @param email - The email address to validate
 * @returns true if email is valid format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase())
}

/**
 * Checks if email is from a disposable domain
 * @param email - The email address to check
 * @param disposableDomains - List of disposable domains
 * @returns true if email is from disposable domain
 */
export function isDisposableEmail(
  email: string,
  disposableDomains: string[]
): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return disposableDomains.includes(domain)
}

// =====================================================
// PHONE VALIDATION
// =====================================================

/**
 * Validates phone number format (international or local)
 * Accepts: +1234567890, (123) 456-7890, 123-456-7890, etc.
 * @param phone - The phone number to validate
 * @returns true if phone is valid format
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Check if it has at least 10 digits
  const digitsOnly = cleaned.replace(/\+/g, '')
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Checks if phone number is sequential (spam indicator)
 * Examples: 1111111111, 1234567890, 0000000000
 * @param phone - The phone number to check
 * @returns true if phone appears to be sequential
 */
export function isSequentialPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '')

  // Check for repeated digits
  if (/^(\d)\1+$/.test(digitsOnly)) return true

  // Check for sequential ascending
  const isAscending = digitsOnly
    .split('')
    .every((digit, i, arr) => i === 0 || parseInt(digit) === parseInt(arr[i - 1]) + 1)

  // Check for sequential descending
  const isDescending = digitsOnly
    .split('')
    .every((digit, i, arr) => i === 0 || parseInt(digit) === parseInt(arr[i - 1]) - 1)

  return isAscending || isDescending
}

// =====================================================
// QUALITY SCORE CALCULATION
// =====================================================

/**
 * Calculates quality score for a lead based on multiple factors
 * Score range: 0-1, mapped to categories: high (>=0.75), medium (0.4-0.75), low (<0.4)
 *
 * @param lead - The lead data to score
 * @param supabase - Supabase client (not currently used, reserved for future ML models)
 * @returns Quality score result with score, category, and reasons
 */
export async function calculateQualityScore(
  lead: Partial<Lead>,
  supabase?: SupabaseClient
): Promise<QualityScoreResult> {
  let score = 0
  const reasons: string[] = []

  // Email validity: +0.15
  if (lead.email && isValidEmail(lead.email)) {
    score += 0.15
    reasons.push('Valid email format')
  }

  // Phone validity: +0.15
  if (lead.phone && isValidPhone(lead.phone)) {
    if (!isSequentialPhone(lead.phone)) {
      score += 0.15
      reasons.push('Valid phone number')
    }
  }

  // Message length quality
  const messageLength = lead.message?.length || 0
  if (messageLength > 100) {
    score += 0.15
    reasons.push('Detailed message (>100 chars)')
  } else if (messageLength > 50) {
    score += 0.1
    reasons.push('Adequate message length')
  }

  // Check for booking-related keywords
  const bookingKeywords = [
    'book',
    'reservation',
    'stay',
    'room',
    'night',
    'guest',
    'check-in',
    'checkout',
    'availability',
    'dates',
    'price',
    'quote',
  ]

  const messageLower = lead.message?.toLowerCase() || ''
  const hasBookingKeywords = bookingKeywords.some((keyword) =>
    messageLower.includes(keyword)
  )

  if (hasBookingKeywords) {
    score += 0.1
    reasons.push('Contains booking-related keywords')
  }

  // Message has specific details (numbers, dates, etc.)
  const hasNumbers = /\d/.test(messageLower)
  const hasQuestionMark = /\?/.test(messageLower)

  if (hasNumbers) {
    score += 0.05
    reasons.push('Contains specific details (numbers/dates)')
  }

  if (hasQuestionMark) {
    score += 0.05
    reasons.push('Contains questions (engaged inquiry)')
  }

  // Contact completeness bonus
  if (lead.email && lead.phone) {
    score += 0.1
    reasons.push('Complete contact information')
  }

  // Normalize to 0-1 range (max possible is ~0.85)
  score = Math.min(score, 1)

  // Determine category
  let category: 'high' | 'medium' | 'low'
  if (score >= 0.75) {
    category = 'high'
  } else if (score >= 0.4) {
    category = 'medium'
  } else {
    category = 'low'
  }

  return { score, category, reasons }
}

// =====================================================
// SPAM SCORE CALCULATION
// =====================================================

/**
 * Calculates spam score for a lead based on configured rules
 * Score >= 0.6 is considered spam
 *
 * @param lead - The lead data to check
 * @param hotelId - The hotel ID to check for custom rules
 * @param supabase - Supabase client to fetch spam rules
 * @returns Spam score result with score, flags, and spam determination
 */
export async function calculateSpamScore(
  lead: Partial<Lead>,
  hotelId: string,
  supabase: SupabaseClient
): Promise<SpamScoreResult> {
  let score = 0
  const flags: string[] = []

  // Fetch all applicable spam rules (global + hotel-specific)
  const { data: rules } = await supabase
    .from('spam_detection_rules')
    .select('*')
    .eq('enabled', true)
    .or(`hotel_id.is.null,hotel_id.eq.${hotelId}`)

  if (!rules) {
    return { score: 0, flags: [], isSpam: false }
  }

  // Check each rule
  for (const rule of rules as SpamDetectionRule[]) {
    let ruleMatched = false

    switch (rule.rule_type) {
      case 'email_domain':
        if (lead.email) {
          const domain = lead.email.split('@')[1]?.toLowerCase()
          if (domain === rule.rule_value.toLowerCase()) {
            ruleMatched = true
          }
        }
        break

      case 'keyword':
        if (lead.message) {
          const messageLower = lead.message.toLowerCase()
          if (messageLower.includes(rule.rule_value.toLowerCase())) {
            ruleMatched = true
          }
        }
        break

      case 'length':
        if (lead.message) {
          const minLength = parseInt(rule.rule_value)
          if (lead.message.length < minLength) {
            ruleMatched = true
          }
        }
        break

      case 'pattern':
        ruleMatched = checkPattern(lead, rule.rule_value)
        break

      case 'ip':
        if (lead.ip_address === rule.rule_value) {
          ruleMatched = true
        }
        break
    }

    if (ruleMatched) {
      score += rule.spam_score_increment
      flags.push(rule.rule_name)

      // If blocking rule, immediately mark as spam
      if (rule.is_blocking) {
        return { score: 1.0, flags, isSpam: true }
      }
    }
  }

  // Normalize score to 0-1
  score = Math.min(score, 1)

  // Determine if spam (threshold: 0.6)
  const isSpam = score >= 0.6

  return { score, flags, isSpam }
}

/**
 * Checks pattern-based spam rules
 * @param lead - The lead data
 * @param pattern - The pattern type to check
 * @returns true if pattern matches
 */
function checkPattern(lead: Partial<Lead>, pattern: string): boolean {
  const message = lead.message || ''

  switch (pattern) {
    case 'all_caps':
      // Check if message is mostly uppercase (>70%)
      const uppercaseCount = (message.match(/[A-Z]/g) || []).length
      const letterCount = (message.match(/[A-Za-z]/g) || []).length
      return letterCount > 10 && uppercaseCount / letterCount > 0.7

    case 'multiple_urls':
      // Check for 3+ URLs
      const urlCount = (
        message.match(
          /https?:\/\/[^\s]+|www\.[^\s]+/gi
        ) || []
      ).length
      return urlCount >= 3

    case 'no_spaces':
      // Check if message has very few spaces relative to length
      const spaceCount = (message.match(/\s/g) || []).length
      return message.length > 20 && spaceCount < message.length * 0.05

    case 'excessive_punctuation':
      // Check for repeated punctuation (!!!, ???, etc.)
      return /[!?]{3,}/.test(message)

    case 'random_email':
      if (!lead.email) return false
      const localPart = lead.email.split('@')[0]
      // Check for random-looking sequences (>5 consonants in a row, etc.)
      return /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(localPart)

    case 'invalid_email':
      return !isValidEmail(lead.email)

    case 'invalid_phone':
      return lead.phone !== null && !isValidPhone(lead.phone)

    case 'sequential_phone':
      return lead.phone !== null && lead.phone !== undefined && isSequentialPhone(lead.phone)

    default:
      return false
  }
}

// =====================================================
// DUPLICATE DETECTION
// =====================================================

/**
 * Checks if a lead is a duplicate based on composite key
 * Uses: (website_config_id, form_id, entry_id)
 *
 * @param lead - The lead data to check
 * @param websiteConfigId - The website config ID
 * @param supabase - Supabase client
 * @returns Duplicate check result
 */
export async function checkDuplicate(
  lead: Partial<Lead>,
  websiteConfigId: string,
  supabase: SupabaseClient
): Promise<DuplicateCheckResult> {
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('website_config_id', websiteConfigId)
    .eq('form_id', lead.form_id!)
    .eq('entry_id', lead.entry_id!)
    .single()

  if (existingLead) {
    return {
      isDuplicate: true,
      existingLeadId: existingLead.id,
    }
  }

  return { isDuplicate: false }
}

// =====================================================
// API KEY GENERATION
// =====================================================

/**
 * Generates a secure API key with bba_ prefix
 * Format: bba_[32 hex characters] = 128 bits of entropy
 * @returns Generated API key
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(16) // 16 bytes = 128 bits
  const hexString = randomBytes.toString('hex') // 32 hex characters
  return `bba_${hexString}`
}

/**
 * Generates a secure webhook secret for HMAC signatures
 * @returns 32 random hex characters
 */
export function generateWebhookSecret(): string {
  const randomBytes = crypto.randomBytes(16)
  return randomBytes.toString('hex')
}

// =====================================================
// WEBHOOK SIGNATURE VERIFICATION
// =====================================================

/**
 * Verifies webhook signature using HMAC-SHA256
 * @param payload - The raw request body as string
 * @param signature - The signature from request header
 * @param secret - The webhook secret
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// =====================================================
// HTML EMAIL REPORT GENERATION
// =====================================================

/**
 * Generates HTML email report for daily lead exceptions
 * @param hotelName - Name of the hotel
 * @param stats - Report statistics
 * @param exceptions - List of exceptions to highlight
 * @param websites - Website breakdown information
 * @returns HTML string for email
 */
export function generateReportHTML(
  hotelName: string,
  stats: ReportStats,
  exceptions: Exception[],
  websites: WebsiteInfo[]
): string {
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Lead Report - ${hotelName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      margin: 0;
      color: #1f2937;
      font-size: 24px;
    }
    .date {
      color: #6b7280;
      font-size: 14px;
      margin-top: 5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .stat-card {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-card.high-quality .stat-value {
      color: #10b981;
    }
    .stat-card.spam .stat-value {
      color: #ef4444;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
    }
    .exception {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .exception.warning {
      background-color: #fffbeb;
      border-left-color: #f59e0b;
    }
    .exception-type {
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 4px;
    }
    .exception.warning .exception-type {
      color: #92400e;
    }
    .exception-details {
      font-size: 14px;
      color: #4b5563;
    }
    .website-list {
      list-style: none;
      padding: 0;
    }
    .website-item {
      background-color: #f9fafb;
      padding: 12px 15px;
      margin-bottom: 8px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .website-name {
      font-weight: 500;
      color: #1f2937;
    }
    .website-stats {
      font-size: 14px;
      color: #6b7280;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 20px;
    }
    .no-exceptions {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      color: #166534;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daily Lead Report</h1>
      <div class="date">${hotelName} - ${reportDate}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.total_leads}</div>
        <div class="stat-label">Total Leads</div>
      </div>
      <div class="stat-card high-quality">
        <div class="stat-value">${stats.high_quality_leads}</div>
        <div class="stat-label">High Quality</div>
      </div>
      <div class="stat-card spam">
        <div class="stat-value">${stats.spam_leads}</div>
        <div class="stat-label">Spam Detected</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Exceptions & Alerts</div>
      ${
        exceptions.length === 0
          ? '<div class="no-exceptions">No exceptions to report. All leads within normal parameters.</div>'
          : exceptions
              .map(
                (ex) => `
        <div class="exception ${ex.severity}">
          <div class="exception-type">${ex.type} (${ex.count})</div>
          <div class="exception-details">${ex.details}</div>
        </div>
      `
              )
              .join('')
      }
    </div>

    <div class="section">
      <div class="section-title">Website Breakdown</div>
      <ul class="website-list">
        ${websites
          .map(
            (site) => `
          <li class="website-item">
            <span class="website-name">${site.website_name}</span>
            <span class="website-stats">${site.lead_count} leads (${site.high_quality_count} high quality)</span>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bookingboost.app'}/dashboard-admin/leads" class="button">
        View All Leads
      </a>
    </div>

    <div class="footer">
      <p>This is an automated report from Booking Boost</p>
      <p>&copy; ${new Date().getFullYear()} Booking Boost. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
