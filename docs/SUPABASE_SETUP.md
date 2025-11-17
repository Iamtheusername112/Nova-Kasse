# Supabase Setup for Banking App

## Disable Email Verification

To allow users to sign in immediately after signup (without email verification), you need to configure your Supabase project:

1. **Go to your Supabase Dashboard**
   - Navigate to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Access Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" tab
   - Find "Email" provider

3. **Disable Email Confirmation**
   - Scroll down to "Email Auth" settings
   - Find "Confirm email" toggle
   - **Turn OFF** the "Confirm email" option
   - This allows users to sign in immediately after signup

4. **Alternative: Enable Auto-Confirm (Recommended)**
   - Go to "Authentication" → "Settings"
   - Under "User Management", find "Enable email confirmations"
   - **Uncheck** this option
   - This will auto-confirm all new signups

## Important Security Note

Disabling email verification means:
- ✅ Users can sign in immediately after signup
- ⚠️ Less security (anyone with email access can create accounts)
- ⚠️ Consider implementing additional verification methods for production

For a production banking app, you might want to:
- Keep email verification but make it optional
- Implement SMS verification
- Add KYC (Know Your Customer) verification
- Use two-factor authentication

## Database Schema

See `lib/supabase/setup.sql` for the complete database setup script.

