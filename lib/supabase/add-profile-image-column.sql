-- Add profile_image_url column to profiles table
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Add profile_image_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image_url TEXT;
    RAISE NOTICE 'Added profile_image_url column';
  ELSE
    RAISE NOTICE 'profile_image_url column already exists';
  END IF;
END $$;

-- Update the trigger function to handle profile_image_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
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
    document_type,
    id_document_url,
    id_document_front_url,
    id_document_back_url,
    proof_of_address_url,
    account_number,
    routing_number,
    account_type,
    currency,
    profile_image_url
  )
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      AND TRIM(NEW.raw_user_meta_data->>'date_of_birth') != ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'address'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'state'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'zip_code'), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'country', '')), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'security_pin'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'document_type'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_document_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_document_front_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_document_back_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'proof_of_address_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'account_number'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'routing_number'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'account_type'), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'currency'), ''), 'USD'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'profile_image_url'), '')
  )
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
    id_document_front_url = COALESCE(EXCLUDED.id_document_front_url, profiles.id_document_front_url),
    id_document_back_url = COALESCE(EXCLUDED.id_document_back_url, profiles.id_document_back_url),
    proof_of_address_url = COALESCE(EXCLUDED.proof_of_address_url, profiles.proof_of_address_url),
    document_type = COALESCE(EXCLUDED.document_type, profiles.document_type),
    account_number = COALESCE(EXCLUDED.account_number, profiles.account_number),
    routing_number = COALESCE(EXCLUDED.routing_number, profiles.routing_number),
    account_type = COALESCE(EXCLUDED.account_type, profiles.account_type),
    currency = COALESCE(EXCLUDED.currency, profiles.currency),
    profile_image_url = COALESCE(EXCLUDED.profile_image_url, profiles.profile_image_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'profile_image_url';

