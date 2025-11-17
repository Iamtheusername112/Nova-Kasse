# How to Disable Email Confirmation in Supabase

## Method 1: Via Dashboard (Recommended)

1. Go to your **Supabase Dashboard**
2. Click **Authentication** in the left sidebar
3. Click **Providers** tab (at the top)
4. Find **Email** provider section
5. Look for **"Confirm email"** toggle/checkbox
6. Turn it **OFF** (unchecked)

**Note**: If you don't see this option, your Supabase version might be different. Try Method 2.

## Method 2: Via SQL (Alternative)

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable email confirmation requirement
UPDATE auth.config 
SET enable_signup = true,
    enable_email_signup = true,
    enable_email_autoconfirm = true
WHERE id = 1;
```

**Note**: This might not work on all Supabase versions. Check if the `auth.config` table exists first.

## Method 3: Check Project Settings

1. Go to **Project Settings** (gear icon)
2. Look for **Authentication** section
3. Check for **"Email Auth"** settings
4. Look for **"Enable email confirmations"** or similar option

## Why This Matters

When email confirmation is enabled:
- Users must verify their email before they can sign in
- No session is created immediately after signup
- Documents can't be uploaded during signup (no session = no upload permission)

When disabled:
- Users can sign in immediately after signup
- Session is created automatically
- Documents can be uploaded right away

## Current Workaround

If you can't disable email confirmation, the app will:
1. Save document type and other KYC data during signup
2. Store files temporarily (if possible)
3. Upload documents after user signs in for the first time

However, this requires users to upload documents again after first login, which is not ideal.

