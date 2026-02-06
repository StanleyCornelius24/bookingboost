# BookingBoost - Video Walkthrough Script

Complete script for creating a screen recording tutorial on adding new clients to BookingBoost.

**Duration:** ~8-10 minutes
**Format:** Screen recording with voiceover
**Tool Suggestions:** Loom, OBS Studio, QuickTime (Mac), or Camtasia

---

## 🎬 Video Structure

### Introduction (30 seconds)

**[Screen: BookingBoost Dashboard]**

> "Hi! In this video, I'll show you how to add a new client to BookingBoost in just 10 minutes. We'll create a hotel profile, set up website integration, and configure Gravity Forms to automatically capture leads. Let's get started!"

---

## Part 1: Creating the Hotel Profile (2 minutes)

### Scene 1.1: Navigate to Hotels Page

**[Action: Click on "Hotels" in sidebar]**

> "First, we'll create a hotel profile for our new client. Click on 'Hotels' in the admin sidebar."

**[Screen: Hotels list page]**

> "This is where all your client hotels are listed. To add a new one, click the 'Add New Hotel' button in the top right."

### Scene 1.2: Fill in Hotel Details

**[Action: Click "Add New Hotel" button]**
**[Screen: Hotel creation form]**

> "Now we'll fill in the basic information for our new client."

**[Action: Type in form fields]**

> "Let's add a sample client - Safari Lodge."

- **Hotel Name:** "Safari Lodge"
  > "Enter the hotel name exactly as you want it to appear in the dashboard."

- **Email:** "info@safarilodge.co.za"
  > "Add their primary contact email."

- **Website:** "https://www.safarilodge.co.za"
  > "Enter the full website URL including https://"

- **Currency:** "ZAR"
  > "Select their currency. This is important for reporting."

**[Action: Click "Create Hotel"]**

> "Click 'Create Hotel' and... perfect! The hotel is now created."

**[Screen: Success message and hotel list]**

> "You'll see a success message and your new hotel appears in the list."

---

## Part 2: Creating Website Integration (2 minutes)

### Scene 2.1: Navigate to Website Integrations

**[Action: Click "Website Integrations" in sidebar]**

> "Next, we need to create a website integration to connect their Gravity Forms to BookingBoost."

**[Screen: Website Integrations page]**

> "Click 'Add New Integration' in the top right."

### Scene 2.2: Configure Integration

**[Action: Click "Add New Integration"]**
**[Screen: Integration form]**

> "Let's configure the integration."

**[Action: Fill in fields]**

- **Website Name:** "Safari Lodge - Main Site"
  > "Give it a descriptive name. If they have multiple sites, add them separately."

- **Website URL:** "https://www.safarilodge.co.za"
  > "Enter the same website URL."

- **Integration Type:** "Gravity Forms"
  > "Select Gravity Forms from the dropdown."

- **Select Hotel:** "Safari Lodge"
  > "Link this integration to the hotel we just created."

- **Status:** "Active"
  > "Make sure it's set to Active."

**[Action: Click "Create Integration"]**

> "Click 'Create Integration' and... done!"

### Scene 2.3: Copy API Credentials

**[Screen: Success message with API credentials displayed]**

> "This is the important part - BookingBoost has generated unique API credentials for this client."

**[Action: Highlight API Key]**

> "You'll see three things here:"
> "1. The API Key - this starts with 'bba_' followed by a long string"

**[Action: Copy API Key]**

> "Copy this API key - we'll need it in a moment."

**[Screen: Show webhook URL and signature]**

> "2. The Webhook URL - this is the same for all clients"
> "3. The Webhook Signature - for enhanced security"

**[Action: Keep this window open or take screenshot]**

> "Keep this information handy. I recommend taking a screenshot or saving it to a password manager."

---

## Part 3: Configuring Gravity Forms (3 minutes)

### Scene 3.1: Access WordPress Admin

**[Action: Switch to WordPress admin panel]**
**[Screen: WordPress dashboard]**

> "Now let's switch over to the client's WordPress site. Make sure you're logged in as an administrator."

**[Action: Navigate to Forms → Settings]**

> "In the WordPress menu, hover over 'Forms', then click 'Settings'."

### Scene 3.2: Access Webhooks

**[Screen: Gravity Forms Settings]**

> "You'll see several tabs at the top."

**[Action: Click "Webhooks" tab]**

> "Click on the 'Webhooks' tab."

**[Screen: Webhooks list]**

> "This is where we'll configure the webhook to send form submissions to BookingBoost."

**[Action: Click "Add New"]**

> "Click 'Add New' to create a new webhook."

### Scene 3.3: Basic Configuration

**[Screen: Webhook configuration page]**

> "Now we'll configure the webhook. This is straightforward."

**[Action: Fill in basic settings]**

- **Name:** "BookingBoost Lead Sync"
  > "Give it a clear name like 'BookingBoost Lead Sync'."

- **Status:** Select "Active"
  > "Make sure Status is set to Active - this is important!"

- **Form:** Select the contact form
  > "Select which form should trigger this webhook. Usually it's your contact or booking request form."

### Scene 3.4: Request Configuration

**[Action: Scroll to Request section]**

> "Now scroll down to the Request section."

**[Action: Fill in request settings]**

- **Request URL:** Paste webhook URL
  > "Paste the webhook URL from BookingBoost. It should be: https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook"

- **Request Method:** "POST"
  > "Set Request Method to POST."

- **Request Format:** "JSON"
  > "Set Request Format to JSON."

### Scene 3.5: Request Body

**[Action: Scroll to Request Body]**

> "For the Request Body, make sure 'All Fields' is selected. This ensures all form data is sent to BookingBoost."

**[Action: Select "All Fields" radio button]**

### Scene 3.6: Request Headers (CRITICAL)

**[Action: Scroll to Request Headers section]**

> "This is the most important part - the Request Headers. This is how BookingBoost authenticates the webhook."

**[Action: Click "Add Header" or fill in first header]**

> "We need to add two headers."

**Header 1:**
- **Name:** "X-API-Key"
  > "First header - Name is 'X-API-Key', all caps with hyphens."

- **Value:** Paste API key
  > "The Value is the API key we copied earlier from BookingBoost. Paste it here carefully - no extra spaces!"

**[Action: Click "Add Header" for second one]**

**Header 2:**
- **Name:** "X-Webhook-Signature"
  > "Second header - Name is 'X-Webhook-Signature'."

- **Value:** Paste webhook signature
  > "The Value is the webhook signature. This is optional but recommended for security."

**[Action: Review headers]**

> "Double-check both headers are spelled correctly. Even a small typo will prevent the webhook from working."

### Scene 3.7: Save Configuration

**[Action: Scroll to bottom]**

> "Now scroll to the bottom and click 'Save Settings'."

**[Action: Click "Save Settings"]**

**[Screen: Success message]**

> "Perfect! You should see a success message. The webhook is now active."

---

## Part 4: Testing the Integration (2 minutes)

### Scene 4.1: Submit Test Form

**[Action: Navigate to website contact page]**
**[Screen: Contact form on website]**

> "Let's test this to make sure everything is working. Go to the client's website and find the contact form."

**[Action: Fill out form with realistic data]**

> "Fill it out with realistic information. Don't use obviously fake data like 'test test' - BookingBoost's spam filter might catch it."

- Name: "John Smith"
- Email: "john@example.com"
- Phone: "555-0123"
- Message: "I'd like to book a room for two adults from March 15-18"

**[Action: Click Submit]**

> "Submit the form. You should see the normal confirmation message."

### Scene 4.2: Check BookingBoost Dashboard

**[Action: Switch to BookingBoost dashboard]**
**[Screen: Navigate to Leads page]**

> "Now let's check if the lead arrived in BookingBoost. Go to the Leads page in the admin dashboard."

**[Action: Select hotel from dropdown if needed]**

> "Make sure 'Safari Lodge' is selected in the hotel filter."

**[Action: Refresh or wait for lead to appear]**

> "And there it is! Our test lead appeared within seconds."

**[Screen: Lead details]**

> "BookingBoost has automatically captured all the form fields - name, email, phone, message, and even assigned a quality score."

---

## Part 5: Troubleshooting Tips (1 minute)

**[Screen: Back to presentation slide or text overlay]**

> "Before we wrap up, here are some quick troubleshooting tips if the webhook isn't working:"

**[Show text on screen or bullet points]**

> "1. Check the webhook status in Gravity Forms - it must be 'Active'"
> "2. Verify the API key is copied exactly - no extra spaces or missing characters"
> "3. Check Gravity Forms webhook logs for error messages"
> "4. Make sure you selected 'All Fields' in the Request Body"
> "5. If leads still don't appear, try triggering WordPress cron manually"

> "For detailed troubleshooting, check the setup guide in the documentation."

---

## Conclusion (30 seconds)

**[Screen: BookingBoost dashboard with successful lead]**

> "And that's it! You've successfully added a new client to BookingBoost. The entire process takes about 10 minutes, and now all their form submissions will automatically flow into the dashboard."

> "For your next client, you can use the automated onboarding script to make this even faster."

> "Thanks for watching! If you have questions, check the documentation or reach out to support."

**[Screen: Fade to BookingBoost logo or end card]**

---

## 📝 Production Notes

### Before Recording:

- [ ] Prepare test data (hotel name, website, email)
- [ ] Have a test WordPress site ready with Gravity Forms
- [ ] Clear browser cookies/cache for clean recording
- [ ] Close unnecessary tabs and applications
- [ ] Test your microphone and screen recording software
- [ ] Zoom browser to 125-150% for better visibility

### Recording Tips:

- **Speak clearly and at a moderate pace**
- **Pause between sections** (easier to edit)
- **Show mouse cursor** (helps viewers follow along)
- **Use zoom/highlight** for important fields (API key, headers)
- **If you make a mistake**, pause, and restart that section

### After Recording:

- [ ] Add chapter markers at each part
- [ ] Add text overlays for key information
- [ ] Add arrows/highlights to draw attention to important fields
- [ ] Include links in video description to documentation
- [ ] Upload to YouTube/Loom and share with team

### Equipment Recommendations:

- **Screen Recording:** Loom (easiest), OBS Studio (free, professional), Camtasia (paid, full-featured)
- **Microphone:** Built-in is okay, USB mic is better
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30fps minimum
- **Format:** MP4 (H.264)

---

## 🎥 Alternative: Quick Loom Recording

If using Loom, you can record this in one take:

1. Click Loom extension
2. Select "Screen + Camera" or "Screen Only"
3. Click "Start Recording"
4. Follow this script naturally
5. Click "Stop Recording"
6. Trim beginning/end
7. Share link

**Estimated time:** 15 minutes to record, 5 minutes to edit

---

## 📤 Distribution

Once created, share this video:

- With new team members during onboarding
- In client onboarding documentation
- On the BookingBoost help center
- In email templates when adding new clients

**Suggested title:** "How to Add a New Client to BookingBoost (10-Minute Setup)"

**Suggested description:**
```
Learn how to add a new hotel client to BookingBoost in just 10 minutes.

In this tutorial, you'll learn:
✅ How to create a hotel profile
✅ How to set up website integration
✅ How to configure Gravity Forms webhooks
✅ How to test the integration
✅ Troubleshooting common issues

Resources:
📄 Setup Guide: PROPERTY_SETUP_GUIDE.md
✅ Quick Checklist: QUICK_SETUP_CHECKLIST.md
🤖 Automation Script: scripts/onboard-client.mjs

Timestamps:
0:00 - Introduction
0:30 - Creating Hotel Profile
2:30 - Setting Up Website Integration
4:30 - Configuring Gravity Forms
7:30 - Testing the Integration
9:00 - Troubleshooting Tips
9:30 - Conclusion
```
