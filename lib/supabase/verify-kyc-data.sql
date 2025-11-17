-- Verify KYC Data Storage
-- Run this SQL to check if KYC data is being saved properly
--
-- IMPORTANT: If you get an error about missing columns (id_document_url, proof_of_address_url),
-- run lib/supabase/add-document-columns.sql FIRST to add the missing columns to your profiles table.

-- ============================================
-- CHECK 1: View user metadata for all users
-- ============================================
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'date_of_birth' as date_of_birth,
  raw_user_meta_data->>'address' as address,
  raw_user_meta_data->>'city' as city,
  raw_user_meta_data->>'state' as state,
  raw_user_meta_data->>'zip_code' as zip_code,
  raw_user_meta_data->>'country' as country,
  raw_user_meta_data->>'security_pin' as security_pin,
  raw_user_meta_data->>'id_document_url' as id_document_url,
  raw_user_meta_data->>'proof_of_address_url' as proof_of_address_url,
  raw_user_meta_data as all_metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- CHECK 2: Check if document columns exist
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('id_document_url', 'proof_of_address_url');

-- ============================================
-- CHECK 2B: View profiles table data (basic fields)
-- ============================================
SELECT 
  id,
  full_name,
  phone,
  date_of_birth,
  address,
  city,
  state,
  zip_code,
  country,
  security_pin,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- CHECK 2C: View profiles table data (with document URLs if columns exist)
-- ============================================
-- Run this only AFTER running add-document-columns.sql
-- SELECT 
--   id,
--   full_name,
--   phone,
--   date_of_birth,
--   address,
--   city,
--   state,
--   zip_code,
--   country,
--   security_pin,
--   id_document_url,
--   proof_of_address_url,
--   created_at,
--   updated_at
-- FROM profiles
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================
-- CHECK 3: Compare metadata vs profiles
-- ============================================
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as metadata_full_name,
  p.full_name as profile_full_name,
  u.raw_user_meta_data->>'phone' as metadata_phone,
  p.phone as profile_phone,
  u.raw_user_meta_data->>'address' as metadata_address,
  p.address as profile_address,
  u.raw_user_meta_data->>'city' as metadata_city,
  p.city as profile_city,
  CASE 
    WHEN u.raw_user_meta_data->>'phone' IS NOT NULL AND p.phone IS NULL THEN 'MISSING IN PROFILE'
    WHEN u.raw_user_meta_data->>'phone' IS NULL AND p.phone IS NOT NULL THEN 'MISSING IN METADATA'
    WHEN u.raw_user_meta_data->>'phone' = p.phone THEN 'MATCH'
    ELSE 'MISMATCH'
  END as phone_status,
  CASE 
    WHEN u.raw_user_meta_data->>'address' IS NOT NULL AND p.address IS NULL THEN 'MISSING IN PROFILE'
    WHEN u.raw_user_meta_data->>'address' IS NULL AND p.address IS NOT NULL THEN 'MISSING IN METADATA'
    WHEN u.raw_user_meta_data->>'address' = p.address THEN 'MATCH'
    ELSE 'MISMATCH'
  END as address_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================
-- CHECK 4: Verify trigger exists
-- ============================================
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- CHECK 5: Count missing data
-- ============================================
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'full_name' IS NOT NULL THEN 1 END) as has_full_name,
  COUNT(CASE WHEN raw_user_meta_data->>'phone' IS NOT NULL THEN 1 END) as has_phone,
  COUNT(CASE WHEN raw_user_meta_data->>'date_of_birth' IS NOT NULL THEN 1 END) as has_dob,
  COUNT(CASE WHEN raw_user_meta_data->>'address' IS NOT NULL THEN 1 END) as has_address,
  COUNT(CASE WHEN raw_user_meta_data->>'city' IS NOT NULL THEN 1 END) as has_city,
  COUNT(CASE WHEN raw_user_meta_data->>'state' IS NOT NULL THEN 1 END) as has_state,
  COUNT(CASE WHEN raw_user_meta_data->>'zip_code' IS NOT NULL THEN 1 END) as has_zip,
  COUNT(CASE WHEN raw_user_meta_data->>'country' IS NOT NULL THEN 1 END) as has_country,
  COUNT(CASE WHEN raw_user_meta_data->>'security_pin' IS NOT NULL THEN 1 END) as has_pin
FROM auth.users;

