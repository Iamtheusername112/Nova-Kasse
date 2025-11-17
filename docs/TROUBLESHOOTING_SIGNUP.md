# Troubleshooting Signup Data Issues

## Problem: Some KYC data not saving to Supabase

If you see that some data (like name, email) is saving but other data (phone, address, etc.) isn't, follow these steps:

## Step 1: Check Browser Console

After signing up, open your browser's Developer Console (F12) and look for:
- "Signing up with data:" - Shows what's being sent
- "User created. Metadata saved:" - Shows what Supabase received
- "Verified user metadata:" - Shows what was actually saved

## Step 2: Check Supabase Dashboard

### Check User Metadata:
1. Go to Supabase Dashboard → Authentication → Users
2. Click on the user you just created
3. Scroll down to "Raw User Meta Data"
4. Check if all fields are there:
   - `full_name` ✓
   - `phone` ❓
   - `date_of_birth` ❓
   - `address` ❓
   - `city` ❓
   - `state` ❓
   - `zip_code` ❓
   - `country` ❓
   - `security_pin` ❓

### Check Profiles Table:
1. Go to Table Editor → `profiles`
2. Find the user's row
3. Check which columns have data

## Step 3: Run the SQL Setup Script

If the profiles table doesn't exist or the trigger isn't working:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `lib/supabase/setup.sql`
3. Paste and run it
4. This will:
   - Create the profiles table
   - Set up the trigger to auto-create profiles
   - Configure RLS policies

## Step 4: Verify Trigger is Working

Run this SQL to check if the trigger exists:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If it doesn't exist, run the setup.sql script again.

## Step 5: Manual Profile Update

If data is in user_metadata but not in profiles table, you can manually update:

```sql
-- Update profile from user metadata
UPDATE profiles p
SET 
  phone = u.raw_user_meta_data->>'phone',
  date_of_birth = (u.raw_user_meta_data->>'date_of_birth')::DATE,
  address = u.raw_user_meta_data->>'address',
  city = u.raw_user_meta_data->>'city',
  state = u.raw_user_meta_data->>'state',
  zip_code = u.raw_user_meta_data->>'zip_code',
  country = u.raw_user_meta_data->>'country',
  security_pin = u.raw_user_meta_data->>'security_pin'
FROM auth.users u
WHERE p.id = u.id
AND u.id = 'YOUR_USER_ID_HERE';
```

## Common Issues

### Issue 1: Phone field not saving
**Possible causes:**
- Phone field might have special characters that need escaping
- Supabase might be filtering certain field names
- Check if phone value is actually being sent (check console logs)

**Solution:**
- Verify phone format in form data
- Check browser console for the actual value being sent
- Try updating manually via SQL

### Issue 2: Trigger not running
**Symptoms:**
- Profile table exists but no rows created
- Data in user_metadata but not in profiles

**Solution:**
- Re-run the setup.sql script
- Check trigger exists (see Step 4)
- Verify trigger function has SECURITY DEFINER

### Issue 3: RLS blocking inserts
**Symptoms:**
- Console shows "policy" or "42501" errors
- Profile insert fails

**Solution:**
- The trigger should handle this (it uses SECURITY DEFINER)
- Check RLS policies are correct
- Verify the insert policy allows authenticated users

### Issue 4: Data in metadata but not in profiles
**Solution:**
- Wait a moment after signup (trigger runs asynchronously)
- Check if trigger function is working
- Use manual update SQL (Step 5)

## Debugging Steps

1. **Enable detailed logging:**
   - Check browser console during signup
   - Look for all console.log statements
   - Check Network tab for Supabase requests

2. **Verify form data:**
   - Add console.log in signup page before calling signUp
   - Verify all formData fields have values

3. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Check for errors during signup
   - Look for trigger execution logs

4. **Test with minimal data:**
   - Try signing up with just email, password, and phone
   - See if phone saves
   - Gradually add more fields

## Quick Fix: Update Existing Users

If you have existing users missing data, run this SQL:

```sql
-- Copy all metadata to profiles table for existing users
INSERT INTO profiles (id, full_name, phone, date_of_birth, address, city, state, zip_code, country, security_pin)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  CASE 
    WHEN raw_user_meta_data->>'date_of_birth' IS NOT NULL 
    THEN (raw_user_meta_data->>'date_of_birth')::DATE
    ELSE NULL
  END,
  raw_user_meta_data->>'address',
  raw_user_meta_data->>'city',
  raw_user_meta_data->>'state',
  raw_user_meta_data->>'zip_code',
  raw_user_meta_data->>'country',
  raw_user_meta_data->>'security_pin'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO UPDATE SET
  phone = COALESCE(EXCLUDED.phone, profiles.phone),
  date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
  address = COALESCE(EXCLUDED.address, profiles.address),
  city = COALESCE(EXCLUDED.city, profiles.city),
  state = COALESCE(EXCLUDED.state, profiles.state),
  zip_code = COALESCE(EXCLUDED.zip_code, profiles.zip_code),
  country = COALESCE(EXCLUDED.country, profiles.country),
  security_pin = COALESCE(EXCLUDED.security_pin, profiles.security_pin),
  updated_at = NOW();
```

