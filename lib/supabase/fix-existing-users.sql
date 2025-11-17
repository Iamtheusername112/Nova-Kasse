-- Run this SQL to fix existing users missing KYC data
-- This will copy data from user_metadata to profiles table

-- First, check what data exists in user_metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'date_of_birth' as date_of_birth,
  raw_user_meta_data->>'address' as address,
  raw_user_meta_data->>'city' as city,
  raw_user_meta_data->>'state' as state,
  raw_user_meta_data->>'zip_code' as zip_code,
  raw_user_meta_data->>'country' as country,
  raw_user_meta_data->>'security_pin' as security_pin,
  raw_user_meta_data as all_metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- First, ensure document columns exist (run add-document-columns.sql first if needed)
-- Then update or insert profiles for all users
INSERT INTO profiles (id, full_name, phone, date_of_birth, address, city, state, zip_code, country, security_pin, id_document_url, proof_of_address_url)
SELECT 
  id,
  NULLIF(TRIM(raw_user_meta_data->>'full_name'), '') as full_name,
  NULLIF(TRIM(raw_user_meta_data->>'phone'), '') as phone,
  CASE 
    WHEN raw_user_meta_data->>'date_of_birth' IS NOT NULL 
    AND TRIM(raw_user_meta_data->>'date_of_birth') != ''
    THEN (raw_user_meta_data->>'date_of_birth')::DATE
    ELSE NULL
  END as date_of_birth,
  NULLIF(TRIM(raw_user_meta_data->>'address'), '') as address,
  NULLIF(TRIM(raw_user_meta_data->>'city'), '') as city,
  NULLIF(TRIM(raw_user_meta_data->>'state'), '') as state,
  NULLIF(TRIM(raw_user_meta_data->>'zip_code'), '') as zip_code,
  NULLIF(TRIM(COALESCE(raw_user_meta_data->>'country', '')), '') as country,
  NULLIF(TRIM(raw_user_meta_data->>'security_pin'), '') as security_pin,
  NULLIF(TRIM(raw_user_meta_data->>'id_document_url'), '') as id_document_url,
  NULLIF(TRIM(raw_user_meta_data->>'proof_of_address_url'), '') as proof_of_address_url
FROM auth.users
ON CONFLICT (id) 
DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  phone = COALESCE(EXCLUDED.phone, profiles.phone),
  date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
  address = COALESCE(EXCLUDED.address, profiles.address),
  city = COALESCE(EXCLUDED.city, profiles.city),
  state = COALESCE(EXCLUDED.state, profiles.state),
  zip_code = COALESCE(EXCLUDED.zip_code, profiles.zip_code),
  country = COALESCE(EXCLUDED.country, profiles.country),
  security_pin = COALESCE(EXCLUDED.security_pin, profiles.security_pin),
  id_document_url = COALESCE(EXCLUDED.id_document_url, profiles.id_document_url),
  proof_of_address_url = COALESCE(EXCLUDED.proof_of_address_url, profiles.proof_of_address_url),
  updated_at = NOW();

-- Verify the data was copied
SELECT 
  p.id,
  p.full_name,
  p.phone,
  p.date_of_birth,
  p.address,
  p.city,
  p.state,
  p.zip_code,
  p.country,
  u.email,
  u.raw_user_meta_data->>'phone' as metadata_phone,
  u.raw_user_meta_data->>'address' as metadata_address
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

