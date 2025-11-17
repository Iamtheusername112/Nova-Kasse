-- Add is_blocked column to profiles table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);

-- Update existing users to have is_blocked = false
UPDATE profiles SET is_blocked = FALSE WHERE is_blocked IS NULL;

