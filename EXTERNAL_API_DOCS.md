# BookingBoost External API Documentation

## Overview

The BookingBoost External API allows you to programmatically access SEO audit data for your properties. This is useful for integrating SEO metrics into your own dashboards, reporting tools, or automation workflows.

## Base URL

```
Production: https://your-domain.com/api/external
Development: http://localhost:3000/api/external
```

## Authentication

All API requests require authentication using an API key. You can provide your API key in two ways:

### Option 1: X-API-Key Header (Recommended)
```bash
X-API-Key: your_api_key_here
```

### Option 2: Authorization Bearer Header
```bash
Authorization: Bearer your_api_key_here
```

### Getting Your API Key

1. Log in to your BookingBoost account
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New API Key**
4. Give it a descriptive name (e.g., "Production Dashboard")
5. Copy and securely store your API key

**⚠️ Important:** API keys are only shown once. Store them securely and never commit them to version control.

---

## Endpoints

### 1. Get SEO Audits

Retrieves SEO audit results for your properties.

**Endpoint:** `GET /api/external/seo-audits`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hotel_id` | string (UUID) | No | - | Filter audits by specific property. If omitted, returns audits for all accessible properties. |
| `limit` | integer | No | 10 | Maximum number of audits to return (per property). |
| `all_hotels` | boolean | No | false | **Admin/SupaAdmin only:** Set to `true` to fetch audits for ALL hotels in the system, not just your own. Non-admin users will still only see their own hotels. |

#### Request Examples

**cURL - Get all properties:**
```bash
curl -X GET 'https://your-domain.com/api/external/seo-audits' \
  -H 'X-API-Key: your_api_key_here'
```

**cURL - Get specific property:**
```bash
curl -X GET 'https://your-domain.com/api/external/seo-audits?hotel_id=abc123-def456' \
  -H 'X-API-Key: your_api_key_here'
```

**cURL - Limit results:**
```bash
curl -X GET 'https://your-domain.com/api/external/seo-audits?limit=5' \
  -H 'X-API-Key: your_api_key_here'
```

**cURL - Get all hotels (Admin only):**
```bash
curl -X GET 'https://your-domain.com/api/external/seo-audits?all_hotels=true' \
  -H 'X-API-Key: your_api_key_here'
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('https://your-domain.com/api/external/seo-audits', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

const data = await response.json();
console.log(data);
```

**Python (Requests):**
```python
import requests

headers = {
    'X-API-Key': 'your_api_key_here'
}

response = requests.get(
    'https://your-domain.com/api/external/seo-audits',
    headers=headers
)

data = response.json()
print(data)
```

**Node.js (Axios):**
```javascript
const axios = require('axios');

const response = await axios.get('https://your-domain.com/api/external/seo-audits', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

console.log(response.data);
```

#### Response Format

**Success Response (200 OK) - User's Own Hotels:**
```json
{
  "success": true,
  "scope": "user_hotels",
  "count": 2,
  "audits": [
    {
      "id": "audit-uuid-1",
      "hotel_id": "hotel-uuid-1",
      "hotel_name": "Luxury Hotel & Spa",
      "hotel_website": "https://luxuryhotel.com",
      "url": "https://luxuryhotel.com",
      "timestamp": "2026-01-07T14:30:00Z",
      "overall_score": 85,
      "checks": {
        "https": {
          "status": "pass",
          "message": "Site uses HTTPS"
        },
        "title": {
          "status": "pass",
          "value": "Luxury Hotel & Spa | Best Hotel in Cape Town",
          "length": 47,
          "message": "Title length is optimal (30-60 characters)"
        },
        "metaDescription": {
          "status": "pass",
          "value": "Experience luxury accommodation at our 5-star hotel...",
          "length": 142,
          "message": "Meta description length is optimal (120-160 characters)"
        },
        "h1": {
          "status": "pass",
          "value": "Welcome to Luxury Hotel & Spa",
          "count": 1,
          "message": "Page has exactly one H1 tag"
        },
        "mobileFriendly": {
          "status": "pass",
          "viewport": "width=device-width, initial-scale=1",
          "message": "Mobile-friendly viewport tag found"
        },
        "pageSpeed": {
          "status": "pass",
          "mobile": {
            "score": 78,
            "lcp": "2.1 s",
            "cls": "0.08"
          },
          "desktop": {
            "score": 92,
            "lcp": "1.3 s",
            "cls": "0.05"
          },
          "message": "PageSpeed data retrieved"
        },
        "robotsTxt": {
          "status": "pass",
          "exists": true,
          "message": "robots.txt file found"
        },
        "xmlSitemap": {
          "status": "pass",
          "exists": true,
          "url": "https://luxuryhotel.com/sitemap.xml",
          "message": "XML Sitemap found"
        },
        "canonical": {
          "status": "pass",
          "value": "https://luxuryhotel.com",
          "message": "Canonical URL is set"
        },
        "metaRobots": {
          "status": "pass",
          "value": "Not set (allows indexing)",
          "message": "Page allows indexing"
        },
        "openGraph": {
          "status": "pass",
          "ogTitle": "Luxury Hotel & Spa",
          "ogDescription": "Experience luxury accommodation...",
          "ogImage": "https://luxuryhotel.com/og-image.jpg",
          "message": "Open Graph tags found"
        },
        "structuredData": {
          "status": "pass",
          "hasJsonLd": true,
          "hasMicrodata": false,
          "type": "Hotel",
          "message": "Structured data found (Hotel)"
        },
        "favicon": {
          "status": "pass",
          "url": "https://luxuryhotel.com/favicon.ico",
          "message": "Favicon found"
        }
      },
      "created_at": "2026-01-07T14:30:00Z"
    }
  ],
  "hotels": [
    {
      "id": "hotel-uuid-1",
      "name": "Luxury Hotel & Spa",
      "website": "https://luxuryhotel.com"
    }
  ]
}
```

**Success Response (200 OK) - All Hotels (Admin only with `all_hotels=true`):**
```json
{
  "success": true,
  "scope": "all_hotels",
  "count": 5,
  "audits": [
    {
      "id": "audit-uuid-1",
      "hotel_id": "hotel-uuid-1",
      "hotel_name": "Luxury Hotel & Spa",
      "hotel_website": "https://luxuryhotel.com",
      "url": "https://luxuryhotel.com",
      "timestamp": "2026-01-07T14:30:00Z",
      "overall_score": 85,
      "checks": { /* ... */ },
      "created_at": "2026-01-07T14:30:00Z",
      "owner": {
        "user_id": "user-uuid-1",
        "email": "owner@example.com",
        "full_name": "John Smith"
      }
    },
    {
      "id": "audit-uuid-2",
      "hotel_id": "hotel-uuid-2",
      "hotel_name": "Beachfront Resort",
      "hotel_website": "https://beachresort.com",
      "url": "https://beachresort.com",
      "timestamp": "2026-01-06T10:15:00Z",
      "overall_score": 78,
      "checks": { /* ... */ },
      "created_at": "2026-01-06T10:15:00Z",
      "owner": {
        "user_id": "user-uuid-2",
        "email": "another@example.com",
        "full_name": "Jane Doe"
      }
    }
  ],
  "hotels": [
    {
      "id": "hotel-uuid-1",
      "name": "Luxury Hotel & Spa",
      "website": "https://luxuryhotel.com",
      "owner": {
        "user_id": "user-uuid-1",
        "email": "owner@example.com",
        "full_name": "John Smith"
      }
    },
    {
      "id": "hotel-uuid-2",
      "name": "Beachfront Resort",
      "website": "https://beachresort.com",
      "owner": {
        "user_id": "user-uuid-2",
        "email": "another@example.com",
        "full_name": "Jane Doe"
      }
    }
  ]
}
```

**Note:** When `all_hotels=true` is used by an admin user, each hotel and audit includes an `owner` object with the property owner's information. The `scope` field indicates whether the response contains `"user_hotels"` or `"all_hotels"`.

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | `API key required` | No API key provided in request |
| 401 | `Invalid API key` | API key not found or incorrect |
| 401 | `API key is inactive` | API key has been deactivated |
| 401 | `API key has expired` | API key has passed its expiration date |
| 403 | `Hotel not found or access denied` | Requested hotel_id doesn't belong to your account |
| 500 | `Internal server error` | Server error occurred |

**Example Error Response:**
```json
{
  "error": "Invalid API key"
}
```

---

## SEO Check Status Values

Each SEO check in the `checks` object has a `status` field with one of these values:

| Status | Icon | Meaning |
|--------|------|---------|
| `pass` | ✅ | Check passed successfully |
| `fail` | ❌ | Check failed - action required |
| `warning` | ⚠️ | Check passed with warnings - recommended to fix |
| `info` | ℹ️ | Informational only - no action needed |

---

## Rate Limits

- **Rate Limit:** 100 requests per minute per API key
- **Burst Limit:** 10 requests per second

Rate limit headers are included in each response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641567890
```

---

## Best Practices

### 1. Secure Your API Key
- Store API keys in environment variables, not in code
- Use different API keys for different environments (dev, staging, prod)
- Rotate API keys periodically
- Revoke compromised keys immediately

**Example (.env file):**
```env
BOOKINGBOOST_API_KEY=your_api_key_here
```

### 2. Handle Errors Gracefully
```javascript
const fetchSEOAudits = async () => {
  try {
    const response = await fetch('https://your-domain.com/api/external/seo-audits', {
      headers: { 'X-API-Key': process.env.BOOKINGBOOST_API_KEY }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch SEO audits:', error);
    // Handle error appropriately
    throw error;
  }
};
```

### 3. Cache Responses
SEO audits don't change frequently. Consider caching responses to reduce API calls:

```javascript
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

let cachedData = null;
let cacheTimestamp = null;

const getSEOAudits = async () => {
  const now = Date.now();

  if (cachedData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }

  const data = await fetchSEOAudits();
  cachedData = data;
  cacheTimestamp = now;

  return data;
};
```

### 4. Monitor API Usage
Keep track of your API usage to stay within rate limits and monitor costs:

```javascript
const trackAPICall = async () => {
  const startTime = Date.now();

  try {
    const data = await fetchSEOAudits();
    const duration = Date.now() - startTime;

    // Log metrics
    console.log(`API call succeeded in ${duration}ms`);

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

---

## Use Cases

### 1. Dashboard Integration
Display SEO health scores across all your properties in a custom dashboard.

### 2. Automated Reporting
Schedule weekly or monthly SEO reports that get emailed to stakeholders.

### 3. Monitoring & Alerts
Set up alerts when SEO scores drop below a threshold:

```javascript
const checkSEOHealth = async () => {
  const { audits } = await fetchSEOAudits();

  audits.forEach(audit => {
    if (audit.overall_score < 70) {
      sendAlert(`SEO score for ${audit.hotel_name} is ${audit.overall_score}%`);
    }
  });
};
```

### 4. Multi-Property Management
Compare SEO performance across multiple properties and identify which ones need attention.

### 5. Admin Dashboard (All Properties)
Monitor SEO health across all properties in the system:

```javascript
// Admin only - fetch all properties
const monitorAllProperties = async () => {
  const { audits, hotels, scope } = await fetch(
    'https://your-domain.com/api/external/seo-audits?all_hotels=true',
    {
      headers: { 'X-API-Key': process.env.ADMIN_API_KEY }
    }
  ).then(r => r.json());

  // Group by owner
  const byOwner = {};
  audits.forEach(audit => {
    const ownerEmail = audit.owner.email;
    if (!byOwner[ownerEmail]) {
      byOwner[ownerEmail] = [];
    }
    byOwner[ownerEmail].push({
      hotel: audit.hotel_name,
      score: audit.overall_score
    });
  });

  // Generate admin report
  console.log('SEO Health Report - All Properties');
  Object.entries(byOwner).forEach(([email, properties]) => {
    const avgScore = properties.reduce((sum, p) => sum + p.score, 0) / properties.length;
    console.log(`${email}: ${properties.length} properties, avg score: ${avgScore.toFixed(1)}%`);
  });
};
```

---

## Support

For API support, please contact:
- **Email:** api-support@bookingboost.com
- **Documentation:** https://docs.bookingboost.com/api
- **Status Page:** https://status.bookingboost.com

---

## Changelog

### v1.0.0 (2026-01-07)
- Initial release
- GET /api/external/seo-audits endpoint
- API key authentication
- Support for filtering by hotel_id
- Configurable result limits
