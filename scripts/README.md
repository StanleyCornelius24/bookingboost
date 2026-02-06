# BookingBoost - Onboarding Scripts

Automation tools to streamline client onboarding.

---

## 🚀 Quick Start

### Onboard a New Client (Interactive)

```bash
node scripts/onboard-client.mjs
```

This will:
1. Prompt you for client details
2. Create hotel record in database
3. Create website integration
4. Generate API credentials
5. Display setup instructions
6. Optionally save details to a file

**Time:** ~2 minutes (vs 10 minutes manually)

---

## 📋 What You'll Need

Before running the script, have ready:

- Hotel name
- Contact email
- Website URL
- Currency (USD, ZAR, EUR, etc.)
- Admin user email (who will own this hotel)

---

## 🎯 Example Usage

```bash
$ node scripts/onboard-client.mjs

╔══════════════════════════════════════════════════════╗
║   BookingBoost - Client Onboarding Wizard          ║
╚══════════════════════════════════════════════════════╝

📋 Step 1: Client Information

Hotel Name: Safari Lodge
Contact Email: info@safarilodge.co.za
Website URL (e.g., https://example.com): https://www.safarilodge.co.za
Currency (USD/ZAR/EUR/GBP) [default: USD]: ZAR

👤 Step 2: Admin User

Admin Email (who owns this hotel): stanley.cornelius@gmail.com
✅ Found user: stanley.cornelius@gmail.com

📍 Step 3: Creating Hotel Record...

✅ Hotel created: Safari Lodge (ID: abc-123-def)

🔗 Step 4: Creating Website Integration...

✅ Website integration created (ID: xyz-456-uvw)

╔══════════════════════════════════════════════════════╗
║              ✅ SETUP COMPLETE!                      ║
╚══════════════════════════════════════════════════════╝

📊 Client Details:
─────────────────────────────────────────────────────
Hotel Name:    Safari Lodge
Hotel ID:      abc-123-def
Email:         info@safarilodge.co.za
Website:       https://www.safarilodge.co.za
Currency:      ZAR
Owner:         stanley.cornelius@gmail.com

🔑 API Credentials (Share with client):
─────────────────────────────────────────────────────
API Key:       bba_xxxxxxxxxxxxxxxxxxxxx
Webhook URL:   https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook
Webhook Secret: xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📁 Files

### `onboard-client.mjs`
Interactive script to add new clients

**Features:**
- Interactive prompts (no command-line arguments needed)
- Creates hotel and integration records
- Generates secure API credentials
- Outputs formatted setup instructions
- Optional file export

### `client-template.json`
Example client configurations

**Usage:**
- Copy an example
- Modify the details
- Use as reference when running the script

---

## 💾 Output File

The script can optionally save setup details to a text file:

```
client-setup-safari-lodge-1707234567890.txt
```

This file contains:
- All client information
- API credentials
- Complete WordPress setup instructions
- Troubleshooting tips

**Use this to:**
- Email to client
- Store in documentation
- Keep as backup reference

---

## 🔒 Security Notes

1. **API Keys are secret** - treat them like passwords
2. **Don't commit** setup output files to git (already in .gitignore)
3. **Share securely** - use encrypted email or password manager
4. **Rotate if compromised** - regenerate keys in the dashboard

---

## 🎬 Video Tutorial

For a visual walkthrough, see:
- **Script:** `docs/VIDEO_WALKTHROUGH_SCRIPT.md`
- **Video:** [Link to recorded video once created]

---

## 🐛 Troubleshooting

### "User not found" error

**Problem:** The admin email doesn't exist in BookingBoost

**Solution:**
1. Create the user account first at: https://bookingboost.vercel.app/signup
2. Or use an existing admin email address

### Script won't run

**Problem:** Missing dependencies

**Solution:**
```bash
npm install
```

### "Permission denied"

**Problem:** Script not executable (Unix/Mac)

**Solution:**
```bash
chmod +x scripts/onboard-client.mjs
```

---

## 📚 Related Documentation

- **Full Guide:** `PROPERTY_SETUP_GUIDE.md`
- **Quick Checklist:** `QUICK_SETUP_CHECKLIST.md`
- **Video Script:** `docs/VIDEO_WALKTHROUGH_SCRIPT.md`

---

## 🤝 Tips for Success

1. **Prepare in advance** - Have all client info ready before starting
2. **Double-check emails** - Typos will cause errors
3. **Save the output** - Always save setup details to a file
4. **Test immediately** - Have client submit a test form right away
5. **Keep organized** - Store output files in a secure location

---

## ⚡ Pro Tips

### Batch Onboarding

If you have multiple clients to add, create a list:

```json
[
  {
    "hotelName": "Safari Lodge",
    "email": "info@safarilodge.co.za",
    "website": "https://www.safarilodge.co.za",
    "currency": "ZAR",
    "adminEmail": "stanley.cornelius@gmail.com"
  },
  {
    "hotelName": "Ocean View Hotel",
    "email": "info@oceanview.com",
    "website": "https://www.oceanview.com",
    "currency": "USD",
    "adminEmail": "stanley.cornelius@gmail.com"
  }
]
```

Run the script once for each client.

### Email Template

After running the script, copy the API credentials into this email template:

```
Subject: BookingBoost Setup - [Hotel Name]

Hi [Client Name],

Your hotel has been set up in BookingBoost! Below are your API credentials and setup instructions.

🔑 API Credentials:
API Key: [paste API key]
Webhook URL: https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook

📝 Setup Instructions:
1. Log into your WordPress admin panel
2. Go to Forms → Settings → Webhooks
3. Click "Add New"
4. Configure as follows:
   - Name: BookingBoost Lead Sync
   - Request URL: [paste webhook URL above]
   - Method: POST
   - Format: JSON
   - Body: All Fields
5. Add Header:
   - Name: X-API-Key
   - Value: [paste API key]
6. Save and test by submitting a form

Your leads will now appear in the BookingBoost dashboard automatically!

View your leads: https://bookingboost.vercel.app/dashboard-admin/leads

Need help? See the full guide: [attach PROPERTY_SETUP_GUIDE.md]

Best regards,
[Your Name]
```

---

## 🎉 Success!

You're now ready to onboard clients in 2 minutes instead of 10!

For questions or issues, check the main documentation or contact support.
