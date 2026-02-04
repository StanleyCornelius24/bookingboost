# OAuth Setup Guide for BookingBoost

This guide will help you set up Google and Meta OAuth integrations for BookingBoost.

## Prerequisites

1. A working BookingBoost installation
2. Access to Google Cloud Console
3. Access to Meta for Developers
4. Your domain/URL where BookingBoost is hosted

## Environment Variables Required

Create a `.env.local` file in your root directory with these variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Meta OAuth Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Analytics Reporting API
   - Google Ads API
   - My Business API (Google Business Profile API)
   - Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: `BookingBoost`
   - User support email: Your email
   - Developer contact email: Your email
4. Add scopes:
   - `auth/userinfo.email`
   - `auth/analytics.readonly`
   - `auth/adwords`
   - `auth/business.manage`
5. Add test users (your email addresses)

### 3. Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Choose **Web application**
4. Set the name: `BookingBoost Web Client`
5. Add Authorized redirect URIs:
   - `http://localhost:3000/api/integrations/google/callback` (for development)
   - `https://yourdomain.com/api/integrations/google/callback` (for production)
6. Copy the **Client ID** and **Client Secret**

### 4. Update Environment Variables

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Meta (Facebook) OAuth Setup

### 1. Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **Create App**
3. Choose **Business** as the app type
4. Fill in the app details:
   - App name: `BookingBoost`
   - Contact email: Your email

### 2. Configure Facebook Login

1. In your app dashboard, add **Facebook Login** product
2. Go to **Facebook Login > Settings**
3. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/integrations/meta/callback` (for development)
   - `https://yourdomain.com/api/integrations/meta/callback` (for production)

### 3. Add Required Permissions

1. Go to **App Review > Permissions and Features**
2. Request the following permissions:
   - `ads_read` - Read advertising insights
   - `business_management` - Manage business assets
   - `pages_read_engagement` - Read page engagement data

### 4. Get App Credentials

1. Go to **Settings > Basic**
2. Copy the **App ID** and **App Secret**

### 5. Update Environment Variables

```bash
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
```

## Domain Configuration

### Development (localhost)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Important:** Make sure your production URL matches exactly what you configured in Google and Meta consoles.

## Troubleshooting

### Google OAuth Issues

**Error: "Missing required parameter: redirect_uri"**
- Check that `NEXT_PUBLIC_APP_URL` is set correctly
- Verify the redirect URI in Google Console matches: `{NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
- Ensure there are no trailing slashes in the URL

**Error: "redirect_uri_mismatch"**
- The redirect URI in your Google Console must exactly match the one being sent
- Check for http vs https
- Verify the domain spelling

### Meta OAuth Issues

**Error: "The provided app ID does not look like a valid app ID"**
- Check that `META_APP_ID` is set correctly
- Verify you're using the App ID, not the App Secret
- Make sure there are no extra spaces or characters

**Error: "Invalid redirect_uri"**
- Check that the redirect URI in Meta Console matches: `{NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`
- Verify the domain is correct

### General Issues

**Error: "Environment variable not configured"**
- Check your `.env.local` file exists
- Restart your development server after adding environment variables
- Verify variable names match exactly (case-sensitive)

## Testing the Integration

1. Start your development server: `npm run dev`
2. Log into BookingBoost
3. Go to Settings page
4. Try connecting Google and Meta accounts
5. Check browser developer console for any error messages
6. Check server logs for detailed error information

## Security Notes

- Never commit your `.env.local` file to version control
- Use different OAuth apps for development and production
- Regularly rotate your API keys and secrets
- Only request the minimum permissions needed
- Review and audit connected accounts regularly

## Support

If you continue to have issues:

1. Check the browser developer console for client-side errors
2. Check your server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure your OAuth apps are configured with the correct redirect URIs
5. Try the OAuth flow in an incognito/private browser window