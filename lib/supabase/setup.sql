-- Run this SQL in your Supabase SQL Editor to create the profiles table
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  security_pin TEXT, -- Note: In production, hash this!
  document_type TEXT,
  id_document_url TEXT,
  id_document_front_url TEXT,
  id_document_back_url TEXT,
  proof_of_address_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, phone, date_of_birth, address, city, state, zip_code, country, 
    security_pin, document_type, id_document_url, id_document_front_url, 
    id_document_back_url, proof_of_address_url
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
    NULLIF(TRIM(NEW.raw_user_meta_data->>'proof_of_address_url'), '')
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
    document_type = COALESCE(EXCLUDED.document_type, profiles.document_type),
    id_document_url = COALESCE(EXCLUDED.id_document_url, profiles.id_document_url),
    id_document_front_url = COALESCE(EXCLUDED.id_document_front_url, profiles.id_document_front_url),
    id_document_back_url = COALESCE(EXCLUDED.id_document_back_url, profiles.id_document_back_url),
    proof_of_address_url = COALESCE(EXCLUDED.proof_of_address_url, profiles.proof_of_address_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

