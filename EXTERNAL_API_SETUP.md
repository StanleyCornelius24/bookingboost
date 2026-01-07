# External API Setup Guide

## What I've Built

I've created a complete external API system that allows external applications to fetch SEO audit data from your BookingBoost platform.

### Files Created:

1. **`create-api-keys-table.sql`** - Database migration for API key storage
2. **`create-seo-audits-table.sql`** - Database migration for SEO audit caching
3. **`app/api/external/seo-audits/route.ts`** - External API endpoint
4. **`app/api/client/api-keys/route.ts`** - API key management endpoint
5. **`EXTERNAL_API_DOCS.md`** - Complete developer documentation

---

## Setup Instructions

### Step 1: Run Database Migrations

You need to run these SQL scripts in your Supabase SQL Editor:

1. **Create SEO Audits Table:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `create-seo-audits-table.sql`
   - Run the script

2. **Create API Keys Table:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `create-api-keys-table.sql`
   - Run the script

### Step 2: Set Environment Variable

Add your Supabase Service Role Key to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

You can find this in:
- Supabase Dashboard → Project Settings → API → Service Role Key

**⚠️ Warning:** This is a powerful key - never commit it to version control!

### Step 3: Test the Endpoint (Optional)

Once the migrations are run, test the endpoint:

```bash
# First, you need to create an API key manually in the database:
INSERT INTO api_keys (user_id, name, key, is_active)
VALUES ('your-user-id', 'Test Key', 'bbk_test123', true);

# Then test the endpoint:
curl -X GET 'http://localhost:3000/api/external/seo-audits' \
  -H 'X-API-Key: bbk_test123'
```

---

## How It Works

### 1. Authentication Flow

```
External App → API Request with API Key → Validate Key → Check Permissions → Return Data
```

1. External app makes request with `X-API-Key` header
2. System validates key exists and is active
3. System checks if key is expired
4. System updates `last_used_at` timestamp
5. System checks if user is admin (for `all_hotels` parameter)
6. System fetches SEO audits for user's hotels (or all hotels if admin)
7. Returns enriched data with hotel information (and owner info for admin)

### 2. API Key Generation

API keys are generated with the format: `bbk_{64_hex_characters}`

Example: `bbk_a1b2c3d4e5f6...xyz`

The `bbk_` prefix helps identify BookingBoost keys and prevents accidental exposure.

### 3. Data Structure

Each API key is linked to a user, and each user has multiple hotels. The API returns SEO audits for all hotels belonging to the authenticated user.

```
User → API Key → Hotels → SEO Audits
```

### 4. Admin vs Regular User Permissions

**Regular Users:**
- Can only fetch SEO audits for their own hotels
- Response includes hotel name, website, and audit data
- No owner information included

**Admin/SupaAdmin Users:**
- Can fetch their own hotels (default behavior)
- Can fetch ALL hotels by adding `?all_hotels=true`
- When fetching all hotels, response includes:
  - Owner information (user_id, email, full_name) for each hotel
  - `scope: "all_hotels"` indicator
  - Useful for platform monitoring and reporting
- Both `admin` and `supaadmin` roles have this capability

---

## Next Steps

### 1. Build UI for API Key Management (Optional)

You can create a settings page section where users can:
- View their API keys (masked)
- Generate new API keys
- Revoke existing keys
- Toggle active/inactive status

I've already created the backend endpoint at `/api/client/api-keys` that supports:
- `GET` - List all keys (masked)
- `POST` - Create new key
- `DELETE` - Revoke key
- `PATCH` - Toggle active status

### 2. Add Rate Limiting (Recommended)

Consider adding rate limiting to prevent abuse:

```typescript
// Example using a simple in-memory rate limiter
const rateLimit = new Map();

function checkRateLimit(apiKey: string) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  if (!rateLimit.has(apiKey)) {
    rateLimit.set(apiKey, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const limit = rateLimit.get(apiKey);

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}
```

### 3. Monitor API Usage

Track API usage to understand:
- Which endpoints are most popular
- When API keys are being used
- If there are any abuse patterns

You can add logging to the external API:

```typescript
// Log API usage
await supabase
  .from('api_usage_logs')
  .insert({
    api_key_id: apiKeyData.id,
    endpoint: '/api/external/seo-audits',
    timestamp: new Date().toISOString(),
    hotel_id: hotelId,
    response_code: 200
  })
```

---

## Usage Examples

### Example 1: Dashboard Integration

```javascript
// Fetch and display SEO scores for all properties
const fetchSEOData = async () => {
  const response = await fetch('https://your-domain.com/api/external/seo-audits', {
    headers: {
      'X-API-Key': process.env.BOOKINGBOOST_API_KEY
    }
  });

  const { audits, hotels } = await response.json();

  // Display in dashboard
  hotels.forEach(hotel => {
    const latestAudit = audits.find(a => a.hotel_id === hotel.id);
    console.log(`${hotel.name}: ${latestAudit?.overall_score}%`);
  });
};
```

### Example 2: Automated Monitoring

```javascript
// Check SEO health and send alerts
const monitorSEO = async () => {
  const { audits } = await fetchSEOAudits();

  audits.forEach(audit => {
    if (audit.overall_score < 70) {
      sendAlert({
        title: 'SEO Score Alert',
        message: `${audit.hotel_name} SEO score dropped to ${audit.overall_score}%`,
        severity: 'warning'
      });
    }
  });
};

// Run every 6 hours
setInterval(monitorSEO, 6 * 60 * 60 * 1000);
```

### Example 3: Weekly Reports

```javascript
// Generate weekly SEO report
const generateWeeklyReport = async () => {
  const { audits, hotels } = await fetchSEOAudits();

  const report = {
    date: new Date().toISOString(),
    properties: hotels.map(hotel => {
      const audit = audits.find(a => a.hotel_id === hotel.id);
      return {
        name: hotel.name,
        score: audit?.overall_score || 0,
        issues: Object.entries(audit?.checks || {})
          .filter(([key, check]) => check.status === 'fail')
          .map(([key, check]) => check.message)
      };
    })
  };

  // Email report to stakeholders
  await sendEmail({
    to: 'team@company.com',
    subject: 'Weekly SEO Report',
    body: generateEmailHTML(report)
  });
};
```

### Example 4: Admin Platform Monitoring

```javascript
// Admin only - monitor all properties across the platform
const platformHealthDashboard = async () => {
  const response = await fetch(
    'https://your-domain.com/api/external/seo-audits?all_hotels=true&limit=50',
    {
      headers: { 'X-API-Key': process.env.ADMIN_API_KEY }
    }
  );

  const { audits, hotels, scope } = await response.json();

  // Calculate platform statistics
  const stats = {
    totalProperties: hotels.length,
    totalAudits: audits.length,
    averageScore: audits.reduce((sum, a) => sum + a.overall_score, 0) / audits.length,
    propertiesUnder70: audits.filter(a => a.overall_score < 70).length,
    uniqueOwners: new Set(audits.map(a => a.owner.user_id)).size
  };

  // Identify properties needing attention
  const needsAttention = audits
    .filter(a => a.overall_score < 70)
    .map(a => ({
      hotel: a.hotel_name,
      owner: a.owner.email,
      score: a.overall_score,
      failedChecks: Object.entries(a.checks)
        .filter(([_, check]) => check.status === 'fail')
        .length
    }))
    .sort((a, b) => a.score - b.score);

  console.log('Platform SEO Health Dashboard');
  console.log(`Total Properties: ${stats.totalProperties}`);
  console.log(`Average SEO Score: ${stats.averageScore.toFixed(1)}%`);
  console.log(`Properties Under 70%: ${stats.propertiesUnder70}`);
  console.log(`\nProperties Needing Attention:`);
  needsAttention.forEach(p => {
    console.log(`  ${p.hotel} (${p.owner}): ${p.score}% - ${p.failedChecks} failed checks`);
  });
};
```

---

## Security Best Practices

### 1. API Key Storage
- Store keys in environment variables
- Never commit keys to version control
- Use different keys for dev/staging/prod

### 2. API Key Rotation
- Rotate keys every 90 days
- Revoke compromised keys immediately
- Monitor `last_used_at` for suspicious activity

### 3. Access Control
- Each API key is scoped to a single user
- Users can only access their own hotels' data
- RLS policies enforce data isolation

### 4. Expiration
- Set expiration dates for API keys
- Expired keys are automatically rejected
- Force key renewal for compliance

---

## Troubleshooting

### "Invalid API key" Error
- Check that the key is correctly formatted
- Verify the key exists in the `api_keys` table
- Ensure the key is active (`is_active = true`)
- Check if the key has expired

### "Hotel not found or access denied" Error
- The requested `hotel_id` doesn't belong to the user
- Verify the hotel exists in the database
- Check the user_id associated with the hotel

### Empty Results
- User may not have any hotels yet
- No SEO audits have been run
- Check the `seo_audits` table for data

---

## Documentation for External Developers

Share the `EXTERNAL_API_DOCS.md` file with external developers who need to integrate with your API. It contains:

- Complete endpoint documentation
- Authentication instructions
- Request/response examples in multiple languages
- Error handling guidelines
- Rate limits and best practices
- Real-world use cases

---

## Support

For questions or issues:
1. Check the logs in your deployment platform
2. Review the API endpoint code
3. Test with cURL to isolate frontend vs backend issues
4. Check Supabase logs for database errors
