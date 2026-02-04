# Lead Management System Documentation

Complete documentation for the Booking Boost Lead Management System.

---

## 📚 Documentation Index

### [1. Setup Guide](./LEAD_MANAGEMENT_SETUP.md)
**Complete step-by-step setup instructions**

Topics covered:
- Database setup and migrations
- Environment variables configuration
- Deployment steps
- Gravity Forms integration
- Testing procedures
- Cron job setup
- Email integration (Resend)
- Troubleshooting guide

👉 **Start here if you're setting up the system for the first time**

---

### [2. System Summary](./LEAD_SYSTEM_SUMMARY.md)
**Technical overview and implementation details**

Topics covered:
- Files created (complete inventory)
- Database schema details
- API endpoints reference
- Key features overview
- Deployment checklist
- Statistics and metrics

👉 **Read this for a high-level understanding of the system**

---

### [3. Booking Fields Guide](./BOOKING_FIELDS_GUIDE.md)
**Hotel-specific booking fields documentation**

Topics covered:
- All booking fields explained (dates, guests, value, etc.)
- Automatic field detection from Gravity Forms
- Gravity Forms recommended structure
- Database schema for booking fields
- Admin dashboard display
- Filtering and reporting queries
- Migration steps
- Testing examples

👉 **Reference this for booking-specific field configurations**

---

## 🚀 Quick Start

1. **Read**: [Setup Guide](./LEAD_MANAGEMENT_SETUP.md) - Start here
2. **Run**: Database migrations (3 SQL files in `/migrations`)
3. **Configure**: Environment variables
4. **Deploy**: To production
5. **Integrate**: Configure Gravity Forms webhooks
6. **Test**: Submit sample form
7. **Monitor**: Check admin dashboards

---

## 📁 Project Structure

```
bookingboost/
├── docs/                          # 📚 Documentation (you are here)
│   ├── README.md                  # This file
│   ├── LEAD_MANAGEMENT_SETUP.md   # Setup guide
│   ├── LEAD_SYSTEM_SUMMARY.md     # System overview
│   └── BOOKING_FIELDS_GUIDE.md    # Booking fields reference
│
├── migrations/                    # 🗄️ Database migrations
│   ├── create-lead-management-system.sql
│   ├── seed-default-spam-rules.sql
│   └── add-booking-specific-fields.sql
│
├── app/api/                       # 🔌 API endpoints
│   ├── integrations/gravity-forms/webhook/
│   ├── cron/generate-daily-lead-reports/
│   └── admin/
│       ├── website-configs/
│       ├── leads/
│       └── daily-lead-reports/
│
├── app/dashboard-admin/           # 📊 Admin dashboards
│   ├── leads/
│   ├── website-integrations/
│   └── daily-lead-reports/
│
├── lib/
│   └── lead-utils.ts             # 🛠️ Core utility functions
│
├── types/
│   └── index.ts                  # 📝 TypeScript types
│
└── components/ui/                # 🎨 UI components
    ├── badge.tsx
    └── table.tsx
```

---

## 🔑 Key Features

### 1. Multi-Website Support
- Handles 10-15 hotel websites simultaneously
- Unique API key per website
- Prevents entry ID collisions with composite keys

### 2. Intelligent Form Processing
- Automatic field detection from any Gravity Forms structure
- Extracts booking details (dates, guests, value)
- Contact information (name, email, phone)

### 3. Quality Scoring
- Automated quality assessment (High/Medium/Low)
- Scores based on completeness, validity, and relevance
- Weighted scoring algorithm

### 4. Spam Detection
- 35+ configurable spam rules
- Disposable email blocking
- Keyword and pattern detection
- Automatic spam flagging

### 5. Daily Exception Reports
- Automated daily email reports
- Exception detection (spam spikes, duplicates, low quality)
- Professional HTML templates
- Delivery tracking

### 6. Admin Dashboards
- Leads management with filtering
- Website integrations configuration
- Daily reports viewing

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `website_configs` | Website integrations and API keys |
| `leads` | All form submissions + booking data |
| `lead_quality_scores` | Quality scoring breakdown |
| `spam_detection_rules` | Configurable spam detection |
| `daily_lead_reports` | Generated daily reports |
| `lead_status_changes` | Audit trail |

---

## 🔗 API Endpoints

### Public
- `POST /api/integrations/gravity-forms/webhook` - Receive form submissions

### Admin
- `GET/POST/PUT/DELETE /api/admin/website-configs` - Manage integrations
- `GET/POST /api/admin/leads` - Manage leads
- `GET /api/admin/daily-lead-reports` - View reports

### Cron
- `POST /api/cron/generate-daily-lead-reports` - Generate daily reports

---

## 🛠️ Technologies

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: React 19
- **Email**: Resend (optional)

---

## 📋 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=

# Optional
RESEND_API_KEY=
```

---

## 🆘 Need Help?

1. Check the [Troubleshooting section](./LEAD_MANAGEMENT_SETUP.md#troubleshooting) in the Setup Guide
2. Review [Booking Fields Guide](./BOOKING_FIELDS_GUIDE.md) for field mapping issues
3. See [System Summary](./LEAD_SYSTEM_SUMMARY.md) for technical details

---

## ✅ System Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: February 2024
- **TypeScript**: Fully typed and compiled
- **Tests**: All passing

---

**Built for Booking Boost** 🚀
