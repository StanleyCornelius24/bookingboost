# BookingBoost - Property Setup Guide

Complete guide for integrating a new hotel property with BookingBoost to automatically capture leads from your Gravity Forms contact forms.

---

## Overview

BookingBoost automatically captures form submissions from your hotel websites and consolidates them into a single dashboard. This guide shows you how to add a new property.

**Time required:** 10-15 minutes per property

---

## Prerequisites

- WordPress website with Gravity Forms plugin installed
- Admin access to your WordPress site
- Admin access to BookingBoost dashboard

---

## Step 1: Add Your Hotel in BookingBoost

### 1.1 Access the Admin Dashboard

1. Go to https://bookingboost.vercel.app/dashboard-admin
2. Log in with your credentials

### 1.2 Create a New Hotel

1. Navigate to **Hotels** in the sidebar
2. Click **Add New Hotel**
3. Fill in the details:
   - **Hotel Name:** Full name of your property (e.g., "Turbine Hotel")
   - **Email:** Contact email for the property
   - **Website:** Full website URL (e.g., https://www.turbinehotel.co.za)
   - **Currency:** USD, ZAR, EUR, etc.
4. Click **Create Hotel**
5. **Save the Hotel ID** - you'll need this later

---

## Step 2: Create a Website Integration

### 2.1 Add Website Configuration

1. In BookingBoost, go to **Website Integrations**
2. Click **Add New Integration**
3. Fill in the configuration:
   - **Website Name:** Descriptive name (e.g., "Turbine Hotel - Main Site")
   - **Website URL:** Full URL of your website
   - **Integration Type:** Gravity Forms
   - **Select Hotel:** Choose the hotel you just created
   - **Status:** Active

4. Click **Create Integration**

### 2.2 Copy Your API Credentials

After creating the integration, you'll see:

- **API Key:** `bba_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Webhook URL:** `https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook`
- **Webhook Signature:** `xxxxxxxxxxxxxxxxxxxxxxxx` (optional, for enhanced security)

**Important:** Copy these values - you'll need them in the next step!

---

## Step 3: Configure Gravity Forms Webhook

### 3.1 Access WordPress Admin

1. Log into your WordPress admin panel
2. Navigate to **Forms → Settings → Webhooks**

### 3.2 Create the Webhook

1. Click **Add New**
2. Configure the webhook with these settings:

#### Basic Settings

| Field | Value |
|-------|-------|
| **Name** | BookingBoost Lead Sync |
| **Status** | Active |
| **Form** | Select your contact/booking form |

#### Request Settings

| Field | Value |
|-------|-------|
| **Request URL** | `https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook` |
| **Request Method** | POST |
| **Request Format** | JSON |

#### Request Headers

Add two headers:

**Header 1:**
- **Name:** `X-API-Key`
- **Value:** `bba_xxxxxxxxxxxxxxxxxxxxxxxx` (your API key from Step 2)

**Header 2 (Optional but Recommended):**
- **Name:** `X-Webhook-Signature`
- **Value:** Your webhook signature from Step 2

#### Request Body

- Select **All Fields**
- This sends all form data to BookingBoost

### 3.3 Save the Webhook

1. Click **Save Settings**
2. Make sure the webhook status shows as **Active**

---

## Step 4: Test the Integration

### 4.1 Submit a Test Form

1. Go to your website's contact page
2. Fill out and submit the contact form
3. Use real-looking data (test submissions with "test" in the name may be marked as spam)

### 4.2 Verify in BookingBoost

1. Go to https://bookingboost.vercel.app/dashboard-admin/leads
2. You should see your test lead appear within seconds
3. Check that all fields are captured correctly:
   - Name
   - Email
   - Phone
   - Check-in/Check-out dates (if applicable)
   - Number of guests
   - Room type preferences
   - Any special requests

### 4.3 What Gets Captured?

BookingBoost automatically detects and extracts:

- **Contact Information:** Name, email, phone
- **Booking Details:** Check-in date, check-out date, room type
- **Guest Details:** Number of adults, number of children, nationality
- **Other:** Message/special requests, source URL, submission date

---

## Step 5: Troubleshooting

### Problem: No leads appearing in BookingBoost

**Check 1: Verify the webhook is active**
- Go to WordPress → Forms → Settings → Webhooks
- Ensure status is **Active**

**Check 2: Check Gravity Forms webhook logs**
- In the webhook settings, scroll to **Event History** or **Logs**
- Look for errors or failed requests
- Common errors:
  - 401 Unauthorized → Check your API key is correct
  - 500 Server Error → Contact support

**Check 3: Test the webhook manually**
- Use a tool like Postman or curl to send a test request
- Verify you get a 200/201 success response

**Check 4: WordPress Cron**
- Gravity Forms uses WordPress cron for webhooks
- If webhooks aren't firing, try:
  1. Visit: `https://yoursite.com/wp-cron.php?doing_wp_cron`
  2. Or set up a real cron job (recommended)

### Problem: Leads marked as spam

**Causes:**
- Test submissions with "test" in the name
- Submissions from known spam email domains
- Duplicate submissions within 1 hour

**Solution:**
- Use realistic test data
- You can manually mark leads as "not spam" in the dashboard

### Problem: Missing booking details

**Check your form field mapping:**
- Ensure date fields use YYYY-MM-DD format
- Room types should include keywords like "standard", "deluxe", "suite"
- Number fields for adults/children should contain only digits

---

## Step 6: Optional Enhancements

### Enable Webhook Signature Verification

For enhanced security, BookingBoost can verify that webhooks are genuinely from your website:

1. In BookingBoost, go to **Website Integrations**
2. Edit your integration
3. Set a **Webhook Secret** (e.g., a random 32-character string)
4. In Gravity Forms, add the header:
   - **Name:** `X-Webhook-Signature`
   - **Value:** Your webhook secret

### Set Up Duplicate Detection

BookingBoost automatically detects duplicates using:
- Same email + submitted within 1 hour
- Same phone + submitted within 1 hour
- Exact form ID + entry ID

You can adjust these rules in **Settings → Duplicate Detection**

### Configure Quality Scoring

Leads are automatically scored based on:
- Completeness of information
- Lead source quality
- Historical conversion rates
- Spam indicators

Adjust scoring rules in **Settings → Lead Scoring**

---

## Form Field Recommendations

For best results, structure your Gravity Forms with these fields:

### Essential Fields
- **Name** (Text field)
- **Email** (Email field)
- **Phone** (Phone field)
- **Message** (Textarea)

### Booking Fields
- **Check-in Date** (Date picker, format: YYYY-MM-DD)
- **Check-out Date** (Date picker, format: YYYY-MM-DD)
- **Room Type** (Dropdown: Standard, Deluxe, Suite, etc.)
- **Number of Adults** (Number field)
- **Number of Children** (Number field)
- **Nationality/Country** (Dropdown or text field)

### Optional Fields
- **Special Requests** (Textarea)
- **Budget Range** (Number or dropdown)
- **How did you hear about us?** (Dropdown)

---

## Multiple Forms Per Website

If you have multiple forms on your website (e.g., contact form, booking form, quote request):

1. Create **one** webhook in Gravity Forms
2. Set it to trigger on **All Forms** or select specific forms
3. All submissions will be captured in BookingBoost
4. You can filter by form type in the dashboard

---

## Multi-Website Setup

If you manage multiple hotel websites:

1. **Repeat this guide for each website**
2. Each website gets its own **Website Integration** in BookingBoost
3. Each integration has a unique **API Key**
4. All leads appear in a single dashboard
5. Filter by hotel or website as needed

**Example Setup:**
- Turbine Hotel (Main Site) → API Key: `bba_abc123...`
- Turbine Hotel (Booking Engine) → API Key: `bba_def456...`
- Safari Lodge (Main Site) → API Key: `bba_ghi789...`

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Missing X-API-Key header"
- **Solution:** Ensure you added the X-API-Key header in Gravity Forms webhook settings

**Issue:** "Invalid or inactive API key"
- **Solution:** Copy the API key exactly from BookingBoost, no extra spaces

**Issue:** Webhook timeout errors
- **Solution:** This is usually a WordPress cron issue. Set up a real cron job.

### Get Help

If you encounter issues:

1. Check the **Event History** in Gravity Forms webhook settings
2. Check the **Webhook Logs** in BookingBoost (if available)
3. Contact support with:
   - Hotel name
   - Website URL
   - Error message from webhook logs
   - Screenshot of webhook configuration

---

## Security Best Practices

1. **Keep API Keys Secret**
   - Never share API keys publicly
   - Store them securely
   - Rotate keys if compromised

2. **Enable Webhook Signature**
   - Adds HMAC verification
   - Prevents unauthorized submissions

3. **Monitor for Spam**
   - Review spam-flagged leads periodically
   - Report false positives

4. **Use HTTPS**
   - BookingBoost only accepts HTTPS webhooks
   - Ensure your WordPress site uses SSL

---

## Next Steps

After setup:

1. **Test thoroughly** with multiple form submissions
2. **Train your team** on the BookingBoost dashboard
3. **Set up notifications** for new high-quality leads
4. **Configure automation rules** for lead assignment
5. **Monitor performance** using the Reports dashboard

---

## Quick Reference

### Webhook URL
```
https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook
```

### Required Headers
```
X-API-Key: bba_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Optional Headers
```
X-Webhook-Signature: xxxxxxxxxxxxxxxxxxxxxxxx
```

### Request Method
```
POST
```

### Request Format
```
JSON (All Fields)
```

---

**Last Updated:** February 6, 2026
**Version:** 1.0

For the latest updates and documentation, visit: https://bookingboost.vercel.app/docs
