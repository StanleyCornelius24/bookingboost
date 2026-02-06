# BookingBoost - Quick Setup Checklist

Use this checklist when adding a new property to BookingBoost.

---

## Pre-Setup

- [ ] WordPress site with Gravity Forms installed
- [ ] Admin access to WordPress
- [ ] Admin access to BookingBoost
- [ ] Contact form created in Gravity Forms

---

## BookingBoost Setup (5 minutes)

### 1. Create Hotel
- [ ] Go to https://bookingboost.vercel.app/dashboard-admin/hotels
- [ ] Click "Add New Hotel"
- [ ] Enter: Hotel Name, Email, Website, Currency
- [ ] Save and copy Hotel ID

### 2. Create Website Integration
- [ ] Go to "Website Integrations"
- [ ] Click "Add New Integration"
- [ ] Enter: Website Name, URL, Select Hotel
- [ ] Set Status to "Active"
- [ ] Click "Create"

### 3. Copy Credentials
- [ ] Copy API Key: `bba_xxxxx...`
- [ ] Copy Webhook URL: `https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook`
- [ ] Copy Webhook Signature (optional): `xxxxx...`

---

## Gravity Forms Setup (5 minutes)

### 4. Create Webhook
- [ ] WordPress Admin → Forms → Settings → Webhooks
- [ ] Click "Add New"
- [ ] Name: "BookingBoost Lead Sync"
- [ ] Status: Active
- [ ] Select your contact form

### 5. Configure Request
- [ ] Request URL: `https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook`
- [ ] Method: POST
- [ ] Format: JSON
- [ ] Body: All Fields

### 6. Add Headers
- [ ] Header 1 Name: `X-API-Key`
- [ ] Header 1 Value: `bba_xxxxx...` (from step 3)
- [ ] Header 2 Name: `X-Webhook-Signature` (optional)
- [ ] Header 2 Value: Your signature (from step 3)

### 7. Save
- [ ] Click "Save Settings"
- [ ] Verify Status shows "Active"

---

## Testing (2 minutes)

### 8. Submit Test Form
- [ ] Go to your website contact page
- [ ] Fill out the form with realistic data
- [ ] Submit

### 9. Verify in BookingBoost
- [ ] Go to https://bookingboost.vercel.app/dashboard-admin/leads
- [ ] Refresh the page
- [ ] Verify test lead appears
- [ ] Check all fields populated correctly

### 10. Check Details
- [ ] Name captured
- [ ] Email captured
- [ ] Phone captured
- [ ] Dates captured (if applicable)
- [ ] Guest count captured (if applicable)
- [ ] Message captured

---

## Troubleshooting

If no lead appears:

- [ ] Check webhook status is "Active" in Gravity Forms
- [ ] Check Gravity Forms webhook logs for errors
- [ ] Verify API key is correct (no extra spaces)
- [ ] Try triggering WordPress cron: `yoursite.com/wp-cron.php?doing_wp_cron`
- [ ] Check hotel is selected in BookingBoost dashboard

---

## Common Mistakes

❌ Wrong API key (missing `bba_` prefix)
❌ Extra spaces in API key
❌ Webhook not set to Active
❌ Wrong webhook URL
❌ Forgot to select "All Fields" in request body
❌ Wrong hotel selected in dashboard

---

## Done!

✅ Property is now integrated with BookingBoost
✅ All new form submissions will appear automatically
✅ Access leads at: https://bookingboost.vercel.app/dashboard-admin/leads

---

**Setup Time:** ~10-15 minutes per property

**Need Help?** See the full guide: `PROPERTY_SETUP_GUIDE.md`
