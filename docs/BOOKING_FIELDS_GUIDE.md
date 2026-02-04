# Booking Fields Guide

This guide explains the hotel-specific booking fields in the lead management system and how they are automatically extracted from Gravity Forms submissions.

---

## Overview

The lead management system now captures detailed booking information beyond basic contact details. This enables better lead qualification, value tracking, and conversion management.

---

## Booking Fields

### Date Fields

#### 1. **Enquiry Date** (`enquiry_date`)
- **Type**: DATE
- **Description**: Date when the initial enquiry was made
- **Auto-detection**: Looks for field labels containing "enquiry date" or "inquiry date"
- **Example**: "2024-01-15"
- **Usage**: Track when the lead first showed interest

#### 2. **Booked Date** (`booked_date`)
- **Type**: DATE
- **Description**: Date when the booking was confirmed
- **Auto-detection**: Looks for field labels containing "booked date", "booking date", or "confirmed date"
- **Example**: "2024-01-20"
- **Usage**: When status changes to "confirmed", set this date

#### 3. **Arrival Date** (`arrival_date`)
- **Type**: DATE
- **Description**: Requested check-in/arrival date
- **Auto-detection**: Looks for field labels containing:
  - "arrival"
  - "check-in" or "check in"
  - "from date"
- **Example**: "2024-03-15"
- **Required for**: Hotel booking inquiries
- **Indexed**: Yes (for date range queries)

#### 4. **Departure Date** (`departure_date`)
- **Type**: DATE
- **Description**: Requested check-out/departure date
- **Auto-detection**: Looks for field labels containing:
  - "departure"
  - "check-out" or "check out"
  - "to date"
- **Example**: "2024-03-20"
- **Required for**: Hotel booking inquiries
- **Indexed**: Yes (for date range queries)

---

### Guest Information

#### 5. **Adults** (`adults`)
- **Type**: INTEGER
- **Description**: Number of adult guests
- **Auto-detection**: Looks for field labels containing "adults" or "adult"
- **Default**: 0
- **Example**: 2
- **Usage**: Calculate room requirements, pricing

#### 6. **Children** (`children`)
- **Type**: INTEGER
- **Description**: Number of children guests
- **Auto-detection**: Looks for field labels containing "children", "child", or "kids"
- **Default**: 0
- **Example**: 1
- **Usage**: Calculate room requirements, pricing

#### 7. **Nationality** (`nationality`)
- **Type**: VARCHAR(100)
- **Description**: Guest nationality
- **Auto-detection**: Looks for field labels containing "nationality" or "country"
- **Example**: "United States", "South Africa"
- **Usage**: Marketing analytics, visa requirements

---

### Booking Preferences

#### 8. **Interested In** (`interested_in`)
- **Type**: TEXT
- **Description**: Room type, package, or service the guest is interested in
- **Auto-detection**: Looks for field labels containing:
  - "interested in"
  - "room type"
  - "package"
  - "accommodation"
- **Example**: "Deluxe Suite", "Honeymoon Package", "Safari Package"
- **Usage**: Match guest preferences to available offerings

---

### Lead Value & Source

#### 9. **Lead Value** (`lead_value`)
- **Type**: DECIMAL(10,2)
- **Description**: Estimated booking value in hotel currency
- **Auto-detection**: Looks for field labels containing:
  - "budget"
  - "value"
  - "amount"
- **Auto-calculation**: Extracts numeric value from text (removes currency symbols)
- **Default**: 0
- **Example**: 1500.00
- **Indexed**: Yes (for value-based reporting)
- **Usage**: Prioritize high-value leads, ROI tracking

#### 10. **Lead Source** (`lead_source`)
- **Type**: VARCHAR(50)
- **Description**: How the lead was captured
- **Allowed Values**:
  - `form_submission` (default)
  - `direct_email`
  - `phone_call`
  - `live_chat`
  - `social_media`
  - `referral`
  - `other`
- **Auto-detection**: Set based on payload type
- **Default**: 'form_submission'
- **Indexed**: Yes (for source attribution)
- **Usage**: Track which channels generate the best leads

---

## Updated Lead Status Values

The `status` field now includes hotel-specific statuses:

| Status | Description | Usage |
|--------|-------------|-------|
| `new` | Newly received lead | Initial status for all form submissions |
| `contacted` | Hotel has made initial contact | After first email/call |
| `qualified` | Lead is a genuine booking inquiry | After vetting spam/quality |
| `quote_sent` | Price quote has been sent | Awaiting guest response |
| `confirmed` | Booking confirmed | Guest accepted quote (set `booked_date`) |
| `declined` | Guest declined/cancelled | Lost opportunity |
| `converted` | Lead became a booking | Booking completed (set `converted_at`) |
| `spam` | Flagged as spam | Auto-flagged or manual |
| `rejected` | Not a valid inquiry | Hotel rejected |
| `no_response` | Guest stopped responding | Follow-up ceased |

---

## Gravity Forms Field Mapping

### Automatic Field Detection

The webhook endpoint intelligently detects fields based on their **labels** and **values**. You don't need to configure field IDs manually.

### Recommended Form Structure

For best results, use these field labels in your Gravity Forms:

#### Contact Section
```
- Name (Single Line Text or Name field)
- Email (Email field)
- Phone (Phone field)
```

#### Booking Details Section
```
- Arrival Date (Date field)
- Departure Date (Date field)
- Adults (Number field)
- Children (Number field)
- Interested In (Dropdown or Single Line Text)
```

#### Additional Information
```
- Nationality (Dropdown or Single Line Text)
- Budget (Number field with currency)
- Message (Paragraph Text)
```

### Example Gravity Forms Setup

**Form Name**: "Booking Inquiry"

**Fields**:
1. Name: Single Line Text
2. Email Address: Email
3. Phone Number: Phone
4. Check-in Date: Date (label: "Arrival Date")
5. Check-out Date: Date (label: "Departure Date")
6. Number of Adults: Number (label: "Adults")
7. Number of Children: Number (label: "Children")
8. Room Type: Dropdown (label: "Interested In")
   - Options: Standard Room, Deluxe Suite, Family Room, etc.
9. Nationality: Dropdown (label: "Nationality")
10. Budget Range: Dropdown or Number (label: "Budget")
11. Special Requests: Paragraph Text (label: "Message")

---

## Database Schema

```sql
-- Booking-specific fields added to leads table
ALTER TABLE leads
ADD COLUMN enquiry_date DATE,
ADD COLUMN booked_date DATE,
ADD COLUMN arrival_date DATE,
ADD COLUMN departure_date DATE,
ADD COLUMN adults INTEGER DEFAULT 0,
ADD COLUMN children INTEGER DEFAULT 0,
ADD COLUMN interested_in TEXT,
ADD COLUMN nationality VARCHAR(100),
ADD COLUMN lead_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN lead_source VARCHAR(50) DEFAULT 'form_submission';
```

---

## API Response Example

When a booking inquiry is submitted via Gravity Forms:

```json
{
  "success": true,
  "leadId": "abc123...",
  "isDuplicate": false,
  "composite_key": "website-id:1:entry-42",
  "quality": "high",
  "qualityScore": 0.85,
  "isSpam": false,
  "spamScore": 0.0,
  "status": "new",
  "booking_details": {
    "arrival_date": "2024-03-15",
    "departure_date": "2024-03-20",
    "adults": 2,
    "children": 1,
    "interested_in": "Deluxe Suite",
    "nationality": "United States",
    "lead_value": 2500.00,
    "lead_source": "form_submission"
  }
}
```

---

## Admin Dashboard Display

The updated leads table now shows:

| Column | Content |
|--------|---------|
| Name | Guest name + nationality (if available) |
| Contact | Email + phone (if available) |
| Dates | Arrival to Departure dates |
| Guests | Adults + Children count |
| Value | Estimated booking value (formatted as currency) |
| Quality | High/Medium/Low badge |
| Status | Current lead status badge |
| Source | How the lead was captured |
| Received | Date submitted |

---

## Filtering & Reporting

### Query Leads by Date Range

```sql
-- Find all leads arriving in March 2024
SELECT *
FROM leads
WHERE arrival_date >= '2024-03-01'
AND arrival_date < '2024-04-01'
AND is_spam = false
ORDER BY lead_value DESC;
```

### High-Value Leads Report

```sql
-- Find high-value leads (>$1000) that need follow-up
SELECT
  name,
  email,
  arrival_date,
  departure_date,
  lead_value,
  status,
  submitted_at
FROM leads
WHERE lead_value > 1000
AND status IN ('new', 'contacted', 'qualified')
ORDER BY lead_value DESC, submitted_at DESC;
```

### Conversion Rate by Source

```sql
-- Calculate conversion rate by lead source
SELECT
  lead_source,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*) * 100, 2) as conversion_rate
FROM leads
WHERE is_spam = false
GROUP BY lead_source
ORDER BY conversion_rate DESC;
```

### Average Lead Value

```sql
-- Average lead value by quality category
SELECT
  quality_category,
  COUNT(*) as lead_count,
  AVG(lead_value) as avg_value,
  SUM(lead_value) as total_value
FROM leads
WHERE is_spam = false
AND lead_value > 0
GROUP BY quality_category
ORDER BY avg_value DESC;
```

---

## Migration Steps

### Step 1: Run the Migration

```bash
# Run the booking fields migration
psql -h your-db-host -U postgres -d postgres \
  -f migrations/add-booking-specific-fields.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy the contents of `migrations/add-booking-specific-fields.sql`
3. Execute

### Step 2: Verify Fields Added

```sql
-- Check that all new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN (
  'enquiry_date',
  'booked_date',
  'arrival_date',
  'departure_date',
  'adults',
  'children',
  'interested_in',
  'nationality',
  'lead_value',
  'lead_source'
);
```

### Step 3: Update Existing Leads (Optional)

```sql
-- Set default lead_source for existing leads
UPDATE leads
SET lead_source = 'form_submission'
WHERE lead_source IS NULL;
```

---

## Quality Score Impact

The presence of booking fields can affect quality scoring:

- **Arrival/Departure Dates Provided**: +0.05 to score
- **Adults Count > 0**: +0.03 to score
- **Lead Value > 0**: +0.05 to score
- **Complete Booking Details**: Increases likelihood of "High Quality" categorization

These adjustments ensure that inquiries with detailed booking information are prioritized.

---

## Testing

### Test Webhook with Booking Fields

```bash
curl -X POST https://your-domain.com/api/integrations/gravity-forms/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bba_your-api-key" \
  -d '{
    "form_id": "1",
    "form_title": "Booking Inquiry",
    "entry_id": "test-456",
    "fields": {
      "1": "Jane Smith",
      "2": "jane@example.com",
      "3": "(555) 987-6543",
      "4": {
        "label": "Arrival Date",
        "value": "2024-03-15"
      },
      "5": {
        "label": "Departure Date",
        "value": "2024-03-20"
      },
      "6": {
        "label": "Adults",
        "value": "2"
      },
      "7": {
        "label": "Children",
        "value": "1"
      },
      "8": {
        "label": "Interested In",
        "value": "Deluxe Suite"
      },
      "9": {
        "label": "Nationality",
        "value": "United Kingdom"
      },
      "10": {
        "label": "Budget",
        "value": "$2,500"
      },
      "11": "We are planning our honeymoon and would love to stay in your deluxe suite with ocean view."
    },
    "source_url": "https://myhotel.com/booking",
    "ip": "192.168.1.1",
    "date_created": "2024-01-15 14:30:00"
  }'
```

Expected response will include the booking details.

---

## Summary

The enhanced lead management system now captures:

✅ Contact information (name, email, phone)
✅ Booking dates (enquiry, booked, arrival, departure)
✅ Guest details (adults, children, nationality)
✅ Preferences (interested in, budget)
✅ Lead value and source tracking
✅ Extended status workflow

This enables:
- Better lead qualification
- Value-based prioritization
- Source attribution
- Conversion tracking
- Revenue forecasting
- Booking analytics

---

## Next Steps

1. Run the booking fields migration
2. Update your Gravity Forms to include booking fields
3. Test with sample submissions
4. Monitor the enhanced data in admin dashboards
5. Create reports based on arrival dates and lead values
