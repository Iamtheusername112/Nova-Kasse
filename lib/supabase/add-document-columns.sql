-- Add document URL columns to existing profiles table
-- Run this if you already have a profiles table without document columns

-- Add id_document_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'id_document_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN id_document_url TEXT;
    RAISE NOTICE 'Added id_document_url column';
  ELSE
    RAISE NOTICE 'id_document_url column already exists';
  END IF;
END $$;

-- Add proof_of_address_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'proof_of_address_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN proof_of_address_url TEXT;
    RAISE NOTICE 'Added proof_of_address_url column';
  ELSE
    RAISE NOTICE 'proof_of_address_url column already exists';
  END IF;
END $$;

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

