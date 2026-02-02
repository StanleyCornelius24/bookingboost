# Bugs and Technical Debt

This document tracks known bugs, technical debt, and legacy code that needs attention.

---

## Database Issues

### ⚠️ `hotel_metrics` Table - Legacy/Redundant

**Status:** FIXED (2026-02-02)
**Severity:** High - Caused incorrect data in admin dashboards

#### Problem

The `hotel_metrics` table is populated by a legacy cron job (`/app/api/cron/sync-ga-metrics/route.ts`) that runs unreliably, resulting in incomplete Google Analytics session data.

#### Evidence

**Hippo Hollow - January 2026:**
- `hotel_metrics`: Only 2 records (Jan 11-12) = 406 sessions
- `marketing_metrics`: Complete 31 records = 5,389 sessions

The cron job was supposed to run daily but only executed twice in January, causing admin reports to show 13x less traffic than actual.

#### Root Cause

Two separate systems writing Google Analytics sessions to different tables:

1. **Legacy System** (Unreliable ❌):
   - Cron job: `/app/api/cron/sync-ga-metrics/route.ts`
   - Writes to: `hotel_metrics` table
   - Columns: `hotel_id`, `date`, `users`, `sessions`, `page_views`, `bounce_rate`, `avg_session_duration`
   - Issue: Runs inconsistently, incomplete data

2. **Modern System** (Reliable ✅):
   - Integration API: `/app/api/integrations/google/analytics/route.ts`
   - Writes to: `marketing_metrics` table
   - Rows: `source='google_analytics'`, `metric_type='sessions'`, `value=<session_count>`
   - Benefit: Triggered when users sync data, complete historical data

#### Files Fixed

| File | Change | Status |
|------|--------|--------|
| `/app/api/admin/reports/route.ts` | Changed from `hotel_metrics` to `marketing_metrics` for sessions | ✅ Fixed |
| `/app/api/admin/dashboard-overview/route.ts` | Changed from `hotel_metrics` to `marketing_metrics` for sessions | ✅ Fixed |
| `/app/api/admin/dashboard-overview/route.ts` | Changed from Google Ads API to `marketing_metrics` for ad spend | ✅ Fixed |

#### Code Changes

**Before:**
```typescript
const { data: currentMetrics } = await supabase
  .from('hotel_metrics')
  .select('sessions')
  .eq('hotel_id', hotel.id)
  .gte('date', startDate)
  .lte('date', endDate)

const totalSessions = currentMetrics?.reduce((sum, m) => sum + (m.sessions || 0), 0) || 0
```

**After:**
```typescript
const { data: currentMetrics } = await supabase
  .from('marketing_metrics')
  .select('value')
  .eq('hotel_id', hotel.id)
  .eq('source', 'google_analytics')
  .eq('metric_type', 'sessions')
  .gte('date', startDate)
  .lte('date', endDate)

const totalSessions = currentMetrics?.reduce((sum, m) => sum + (m.value || 0), 0) || 0
```

#### Remaining Concerns

1. **Cron Job Still Running**: `/app/api/cron/sync-ga-metrics/route.ts` still exists and writes to `hotel_metrics`. Consider:
   - Disabling the cron job
   - Or updating it to write to `marketing_metrics` instead
   - Or removing it entirely if no longer needed

2. **Table Can Be Dropped**: If no other code uses `hotel_metrics`, the table can be safely dropped from the database.

3. **Check Other Uses**: Search codebase for any other references to `hotel_metrics` table:
   ```bash
   grep -r "hotel_metrics" --include="*.ts" --include="*.tsx"
   ```

#### Impact

**Before Fix:**
- Admin reports showed 406 sessions for Hippo Hollow in January
- Ad spend showed correctly (R9,967.62) but looked disproportionate to traffic
- Users saw misleading performance data

**After Fix:**
- Admin reports now show 5,389 sessions (accurate)
- Metrics align with individual hotel dashboards
- Correct ROI and performance calculations

---

### ⚠️ Admin Dashboard Ad Spend - Using Google Ads API Instead of Database

**Status:** FIXED (2026-02-02)
**Severity:** Medium - Caused slow/failing ad spend data

#### Problem

The admin dashboard overview was trying to fetch ad spend data directly from the Google Ads API in real-time, which caused:
- Slow page loads (waiting for API calls)
- Failed requests when OAuth tokens expired
- Inconsistent data compared to reports page
- Unnecessary complexity with token fallback logic

#### Evidence

**Admin Dashboard Overview (`/app/api/admin/dashboard-overview/route.ts`):**
- Used Google Ads API client with complex OAuth token management
- Required fallback to admin tokens when hotel tokens unavailable
- Failed silently when tokens expired (ad spend showed $0)
- Made real-time API calls on every dashboard load

**Reports Page (`/app/api/admin/reports/route.ts`):**
- Used `marketing_metrics` table (fast, reliable)
- Consistent data across all views
- No OAuth token dependencies

#### Root Cause

Two different approaches to fetching the same data:

1. **Admin Dashboard (Problematic ❌):**
   - Real-time Google Ads API calls
   - Complex OAuth token management
   - Slow and unreliable

2. **Reports Page (Correct ✅):**
   - Query `marketing_metrics` table
   - Fast database lookup
   - Cached historical data

#### Solution

**Changed admin dashboard to use the same approach as reports:**

```typescript
// Get ad spend from marketing_metrics (includes Google Ads + Meta Ads)
const { data: currentAds } = await supabase
  .from('marketing_metrics')
  .select('value')
  .eq('hotel_id', hotel.id)
  .in('source', ['google_ads', 'meta_ads'])
  .eq('metric_type', 'spend')
  .gte('date', formatDate(currentMonthStart))
  .lte('date', formatDate(currentMonthEnd))

currentAdSpend = currentAds?.reduce((sum, m) => sum + (m.value || 0), 0) || 0
```

**Cleanup:**
- Removed `GoogleAdsApi` import
- Removed entire OAuth token fallback system (36 lines)
- Removed admin token fetching logic
- Simplified error handling

#### Impact

**Before Fix:**
- Dashboard loaded slowly waiting for Google Ads API
- Ad spend often showed $0 due to expired tokens
- Inconsistent with reports page data

**After Fix:**
- Dashboard loads instantly (database query)
- Ad spend always shows if data exists in marketing_metrics
- Consistent with reports page
- Includes both Google Ads + Meta Ads automatically

---

## How to Use This File

1. **Document new bugs**: Add entries with date, severity, problem description, and evidence
2. **Track fixes**: Update status when bugs are resolved
3. **Tech debt**: Document legacy code, workarounds, and areas needing refactoring
4. **Reference**: Link to related GitHub issues, PRs, or commits

---

## Template for New Entries

```markdown
### ⚠️ [Bug/Issue Title]

**Status:** [OPEN/IN_PROGRESS/FIXED]
**Severity:** [Low/Medium/High/Critical]
**Date Discovered:** YYYY-MM-DD

#### Problem
[Clear description of the issue]

#### Evidence
[Data, logs, screenshots showing the problem]

#### Root Cause
[Technical explanation of why this happens]

#### Impact
[Who/what is affected]

#### Solution
[How to fix it, or what was done to fix it]
```
