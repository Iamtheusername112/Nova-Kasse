-- Fix admin policies for tickets table
-- This fixes the "permission denied for table users" error
-- Run this SQL in your Supabase SQL Editor

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;

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

