-- Add currency column to profiles table
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Add currency column with default 'USD'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'AUD'));

-- Create index for faster currency-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_currency ON profiles(currency);

-- Update existing users to have USD as default currency if NULL
UPDATE profiles 
SET currency = 'USD' 
WHERE currency IS NULL;

