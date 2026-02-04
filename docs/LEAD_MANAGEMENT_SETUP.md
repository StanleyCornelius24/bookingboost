# Lead Management System - Setup Guide

This comprehensive guide will help you set up and deploy the advanced lead management system for Booking Boost.

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Steps](#deployment-steps)
5. [Gravity Forms Integration](#gravity-forms-integration)
6. [Testing](#testing)
7. [Cron Job Setup](#cron-job-setup)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

The lead management system consists of:

- **Webhook Endpoint**: Receives form submissions from Gravity Forms
- **Spam Detection**: Automatically filters spam using configurable rules
- **Quality Scoring**: Assigns quality scores (High/Medium/Low) to each lead
- **Duplicate Prevention**: Uses composite keys to prevent ID collisions
- **Daily Reports**: Automated exception reports via email
- **Admin Dashboards**: 3 admin pages for managing leads and integrations

### Technology Stack

- Next.js 16 with App Router
- Supabase (PostgreSQL)
- TypeScript
- Tailwind CSS
- React 19

---

## Database Setup

### Step 1: Run Database Migrations

Execute the SQL migrations in your Supabase dashboard or via CLI:

```bash
# 1. Create all tables and indexes
psql -h your-db-host -U postgres -d postgres -f migrations/create-lead-management-system.sql

# 2. Seed default spam detection rules
psql -h your-db-host -U postgres -d postgres -f migrations/seed-default-spam-rules.sql
```

**Or via Supabase Dashboard:**

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `migrations/create-lead-management-system.sql`
4. Execute the migration
5. Repeat for `migrations/seed-default-spam-rules.sql`

### Step 2: Verify Tables Created

Run this query to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'website_configs',
  'leads',
  'lead_quality_scores',
  'spam_detection_rules',
  'daily_lead_reports',
  'lead_status_changes'
);
```

You should see 6 tables.

### Step 3: Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('website_configs', 'leads', 'daily_lead_reports');
```

---

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron job authentication
CRON_SECRET=your-secure-random-string-here

# Application URL (for webhook URLs and email links)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email service (optional - for daily reports)
# RESEND_API_KEY=your-resend-api-key
```

**Generate CRON_SECRET:**

```bash
openssl rand -hex 32
```

---

## Deployment Steps

### Step 1: Deploy to Production

```bash
# Build the application
npm run build

# Deploy to Vercel/your hosting provider
vercel --prod
```

### Step 2: Verify API Endpoints

After deployment, verify these endpoints are accessible:

- `GET /api/integrations/gravity-forms/webhook` (should return health check)
- `GET /api/cron/generate-daily-lead-reports` (should return health check)

### Step 3: Create First Website Integration

1. Log in to the admin dashboard
2. Navigate to `/dashboard-admin/website-integrations`
3. Click "Add Website"
4. Fill in:
   - Website Name: "My Hotel Website"
   - Website URL: "https://myhotel.com"
   - Daily Report Email: "admin@myhotel.com"
5. Click "Create Integration"
6. **IMPORTANT**: Copy the API key and webhook secret (shown only once!)

---

## Gravity Forms Integration

### Step 1: Configure Webhook in Gravity Forms

1. In WordPress admin, go to Forms → Your Form → Settings → Webhooks
2. Click "Add New"
3. Configure:
   - **Name**: Booking Boost Lead Sync
   - **Request URL**: `https://your-domain.com/api/integrations/gravity-forms/webhook`
   - **Request Method**: POST
   - **Request Format**: JSON

### Step 2: Add Custom Headers

In the webhook settings, add these headers:

```
X-API-Key: bba_your-api-key-here
```

If you generated a webhook secret, also add:

```
X-Webhook-Signature: {HMAC-SHA256 signature - configure in Gravity Forms}
```

### Step 3: Test the Integration

1. Submit a test form on your website
2. Check the webhook logs in Gravity Forms
3. Verify the lead appears in `/dashboard-admin/leads`

### Common Field Mapping

The webhook automatically detects:

- **Name**: Text field (alphabetic characters only)
- **Email**: Any field containing `@`
- **Phone**: Fields matching phone patterns
- **Message**: Longest text field (>20 chars)

For best results, use these Gravity Forms field types:

- Name: Single Line Text or Name field
- Email: Email field
- Phone: Phone field
- Message: Paragraph Text field

---

## Testing

### Test the Webhook Endpoint

```bash
# Replace with your actual API key
curl -X POST https://your-domain.com/api/integrations/gravity-forms/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bba_your-api-key-here" \
  -d '{
    "form_id": "1",
    "form_title": "Contact Form",
    "entry_id": "test-123",
    "fields": {
      "1": "John Doe",
      "2": "john@example.com",
      "3": "(555) 123-4567",
      "4": "I would like to book a room for next weekend. Do you have availability?"
    },
    "source_url": "https://myhotel.com/contact",
    "ip": "192.168.1.1",
    "date_created": "2024-01-15 10:30:00"
  }'
```

Expected response:

```json
{
  "success": true,
  "leadId": "uuid-here",
  "isDuplicate": false,
  "composite_key": "website-id:1:test-123",
  "quality": "high",
  "qualityScore": 0.85,
  "isSpam": false,
  "spamScore": 0.0,
  "status": "new"
}
```

### Test Daily Report Generation

```bash
# Replace with your CRON_SECRET
curl -X POST https://your-domain.com/api/cron/generate-daily-lead-reports \
  -H "Authorization: Bearer your-cron-secret-here"
```

---

## Cron Job Setup

### Option 1: Vercel Cron Jobs (Recommended)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily-lead-reports",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This runs daily at 8:00 AM UTC.

### Option 2: External Cron Service

Use a service like cron-job.org or EasyCron:

- **URL**: `https://your-domain.com/api/cron/generate-daily-lead-reports`
- **Method**: POST
- **Schedule**: `0 8 * * *` (8 AM daily)
- **Headers**: `Authorization: Bearer your-cron-secret`

### Option 3: GitHub Actions

Create `.github/workflows/daily-reports.yml`:

```yaml
name: Generate Daily Lead Reports

on:
  schedule:
    - cron: '0 8 * * *'
  workflow_dispatch:

jobs:
  generate-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Reports
        run: |
          curl -X POST https://your-domain.com/api/cron/generate-daily-lead-reports \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Email Integration (Optional)

To enable email delivery for daily reports, integrate with Resend:

### Step 1: Install Resend

```bash
npm install resend
```

### Step 2: Add API Key

```bash
RESEND_API_KEY=re_your-api-key
```

### Step 3: Update Cron Endpoint

In `app/api/cron/generate-daily-lead-reports/route.ts`, uncomment the Resend integration code:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// In the report generation loop, replace the TODO with:
const { data: emailData, error: emailError } = await resend.emails.send({
  from: 'Booking Boost <reports@bookingboost.app>',
  to: reportEmails,
  subject: `Daily Lead Report - ${hotelName} - ${reportDate}`,
  html: reportHTML,
})
```

---

## Admin Dashboard Pages

The system includes 3 admin dashboard pages:

### 1. Leads Management (`/dashboard-admin/leads`)

- View all leads with filtering
- Filter by quality (High/Medium/Low) or spam
- Summary statistics cards
- Bulk actions (coming soon)

### 2. Website Integrations (`/dashboard-admin/website-integrations`)

- Manage website configurations
- Generate API keys and webhook secrets
- View integration status
- Configure daily reports

### 3. Daily Reports (`/dashboard-admin/daily-lead-reports`)

- View past daily reports
- See exceptions and warnings
- Preview HTML email reports
- Track delivery status

---

## Troubleshooting

### Issue: Leads Not Appearing

**Check:**

1. Webhook URL is correct
2. API key is valid and active
3. Form ID matches configuration
4. Check webhook logs in Gravity Forms

**Debug:**

```sql
-- Check if website config exists
SELECT * FROM website_configs WHERE api_key = 'bba_your-key';

-- Check for recent leads
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;

-- Check for errors in webhook_payload
SELECT id, name, email, webhook_payload
FROM leads
WHERE webhook_payload IS NOT NULL
ORDER BY created_at DESC LIMIT 5;
```

### Issue: Duplicate Leads Being Created

**Check:**

```sql
-- Find duplicates
SELECT website_config_id, form_id, entry_id, COUNT(*)
FROM leads
GROUP BY website_config_id, form_id, entry_id
HAVING COUNT(*) > 1;
```

**Fix**: The composite unique constraint should prevent this. If duplicates exist, the constraint may not be active:

```sql
-- Add constraint if missing
ALTER TABLE leads
ADD CONSTRAINT unique_lead_per_website
UNIQUE (website_config_id, form_id, entry_id);
```

### Issue: Spam Rules Not Working

**Check:**

```sql
-- View all active spam rules
SELECT * FROM spam_detection_rules WHERE enabled = true;

-- Test spam detection manually
SELECT
  id,
  name,
  email,
  spam_score,
  spam_flags,
  is_spam
FROM leads
WHERE spam_score > 0
ORDER BY spam_score DESC
LIMIT 10;
```

### Issue: Daily Reports Not Sending

**Check:**

1. `CRON_SECRET` is set correctly
2. Cron job is configured and running
3. Hotels have `daily_report_enabled = true`
4. Email service is configured (if using Resend)

**Debug:**

```sql
-- Check report generation
SELECT * FROM daily_lead_reports
ORDER BY created_at DESC
LIMIT 10;

-- Check failed deliveries
SELECT * FROM daily_lead_reports
WHERE delivery_status = 'failed';
```

---

## Customization

### Adding Custom Spam Rules

```sql
-- Add a custom spam keyword for your hotel
INSERT INTO spam_detection_rules (
  hotel_id,
  rule_name,
  rule_type,
  rule_value,
  spam_score_increment,
  is_blocking,
  enabled,
  description
) VALUES (
  'your-hotel-id',
  'Custom Spam Keyword',
  'keyword',
  'your-spam-keyword',
  0.5,
  false,
  true,
  'Custom spam detection for our hotel'
);
```

### Adjusting Quality Score Thresholds

Edit `lib/lead-utils.ts` in the `calculateQualityScore` function to adjust:

- Email validity weight (currently +0.15)
- Phone validity weight (currently +0.15)
- Message length thresholds
- Booking keyword detection

### Changing Daily Report Time

Update `website_configs`:

```sql
UPDATE website_configs
SET daily_report_time = '09:00'
WHERE id = 'your-config-id';
```

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the TypeScript types in `types/index.ts`
3. Check the API route files for detailed comments
4. Review the database schema in `migrations/`

---

## Summary

You've successfully set up:

- ✅ Database schema with 6 tables
- ✅ Webhook endpoint for Gravity Forms
- ✅ Spam detection with 35+ default rules
- ✅ Quality scoring system
- ✅ Duplicate prevention
- ✅ Daily exception reports
- ✅ 3 admin dashboard pages
- ✅ TypeScript type safety

**Next Steps:**

1. Run database migrations
2. Set environment variables
3. Deploy to production
4. Create website integrations
5. Configure Gravity Forms webhooks
6. Set up cron job for daily reports
7. Test with sample form submissions

Happy lead managing! 🚀
