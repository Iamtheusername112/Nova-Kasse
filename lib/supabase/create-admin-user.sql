-- Create Admin User Script
-- Run this SQL in your Supabase SQL Editor to create the admin user
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- First, create the admin user in auth.users (you'll need to do this manually via Supabase Dashboard)
-- Or use the Supabase Auth API to create the user first, then run this script

-- After creating the user via Supabase Dashboard or API, update their metadata:
-- 1. Go to Authentication → Users → Find admin@novakasse.com
-- 2. Click on the user → Update user metadata
-- 3. Add: {"role": "admin"}

-- OR use this function to set admin role (requires user to exist first):
-- This function can be called after user creation

-- Create a function to set admin role
CREATE OR REPLACE FUNCTION set_admin_role(user_email TEXT)
RETURNS void AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update user metadata to include admin role
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;

  RAISE NOTICE 'Admin role set for user: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (or use service role)
-- GRANT EXECUTE ON FUNCTION set_admin_role(TEXT) TO authenticated;

-- To create the admin user manually:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Email: admin@novakasse.com
-- 4. Password: Nova_20100
-- 5. Auto Confirm User: Yes (to skip email verification)
-- 6. After creation, click on the user → Update user metadata → Add: {"role": "admin"}

-- OR use the Supabase Management API (requires service role key):
-- POST https://your-project.supabase.co/auth/v1/admin/users
-- Headers: {
--   "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
--   "apikey": "YOUR_SERVICE_ROLE_KEY",
--   "Content-Type": "application/json"
-- }
-- Body: {
--   "email": "admin@novakasse.com",
--   "password": "Nova_20100",
--   "email_confirm": true,
--   "user_metadata": {
--     "role": "admin"
--   }
-- }

-- After user is created, you can verify with:
-- SELECT id, email, raw_user_meta_data->>'role' as role
-- FROM auth.users
-- WHERE email = 'admin@novakasse.com';

