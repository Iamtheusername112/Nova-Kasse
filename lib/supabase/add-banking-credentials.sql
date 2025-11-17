-- Add banking credentials columns to profiles table
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Add banking credentials columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS routing_number TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'checking';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON profiles(account_number);

-- Update the trigger function to include banking credentials
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
    account_type
  )
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'date_of_birth'), '')::DATE,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'address'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'state'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'zip_code'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'security_pin'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'document_type'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_document_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_document_front_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_document_back_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'proof_of_address_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'account_number'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'routing_number'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'account_type'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
    address = COALESCE(EXCLUDED.address, profiles.address),
    city = COALESCE(EXCLUDED.city, profiles.city),
    state = COALESCE(EXCLUDED.state, profiles.state),
    zip_code = COALESCE(EXCLUDED.zip_code, profiles.zip_code),
    country = COALESCE(EXCLUDED.country, profiles.country),
    security_pin = COALESCE(EXCLUDED.security_pin, profiles.security_pin),
    document_type = COALESCE(EXCLUDED.document_type, profiles.document_type),
    id_document_url = COALESCE(EXCLUDED.id_document_url, profiles.id_document_url),
    id_document_front_url = COALESCE(EXCLUDED.id_document_front_url, profiles.id_document_front_url),
    id_document_back_url = COALESCE(EXCLUDED.id_document_back_url, profiles.id_document_back_url),
    proof_of_address_url = COALESCE(EXCLUDED.proof_of_address_url, profiles.proof_of_address_url),
    account_number = COALESCE(EXCLUDED.account_number, profiles.account_number),
    routing_number = COALESCE(EXCLUDED.routing_number, profiles.routing_number),
    account_type = COALESCE(EXCLUDED.account_type, profiles.account_type),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique account number
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
DECLARE
  new_account_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 10-digit account number starting with 1
    new_account_number := '1' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0');
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE account_number = new_account_number) INTO exists_check;
    
    -- Exit loop if unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_account_number;
END;
$$ LANGUAGE plpgsql;

