-- Create tickets table for user support messages
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;

-- Create policy to allow users to read their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to create their own tickets
-- This policy ensures users can only create tickets for themselves
CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- Create policy to allow users to update their own tickets (for adding messages)
CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow admins to view all tickets
-- Note: We check user_metadata from the JWT token instead of querying auth.users table
-- This avoids "permission denied for table users" errors
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    -- Check if user is admin via JWT claims (user_metadata is in the JWT)
    COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->>'user_metadata')::jsonb->>'role',
      ''
    ) = 'admin'
    OR COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->>'email'),
      ''
    ) = 'admin@novakasse.com'
  );

-- Create policy to allow admins to update all tickets
CREATE POLICY "Admins can update all tickets"
  ON tickets FOR UPDATE
  USING (
    -- Check if user is admin via JWT claims (user_metadata is in the JWT)
    COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->>'user_metadata')::jsonb->>'role',
      ''
    ) = 'admin'
    OR COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->>'email'),
      ''
    ) = 'admin@novakasse.com'
  );

-- Create updated_at trigger function (replace if exists)
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

