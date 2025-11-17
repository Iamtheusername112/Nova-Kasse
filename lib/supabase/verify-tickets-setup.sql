-- Verify tickets table and RLS policies are set up correctly
-- Run this SQL in your Supabase SQL Editor to check if everything is configured

-- Check if tickets table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets')
    THEN '✓ Tickets table exists'
    ELSE '✗ Tickets table does NOT exist - Run create-tickets-table.sql'
  END AS table_status;

-- Check RLS is enabled
SELECT 
  CASE 
    WHEN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tickets') IS NOT NULL
      AND (SELECT relrowsecurity FROM pg_class WHERE relname = 'tickets') = true
    THEN '✓ RLS is enabled on tickets table'
    ELSE '✗ RLS is NOT enabled - Run create-tickets-table.sql'
  END AS rls_status;

-- List all policies on tickets table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY policyname;

-- Expected policies:
-- 1. "Users can view own tickets" (SELECT)
-- 2. "Users can create own tickets" (INSERT)
-- 3. "Users can update own tickets" (UPDATE)
-- 4. "Admins can view all tickets" (SELECT)
-- 5. "Admins can update all tickets" (UPDATE)

-- Check if trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_tickets_updated_at' 
      AND tgrelid = 'tickets'::regclass
    )
    THEN '✓ Trigger exists'
    ELSE '✗ Trigger does NOT exist'
  END AS trigger_status;

-- Check if function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'update_tickets_updated_at'
    )
    THEN '✓ Function exists'
    ELSE '✗ Function does NOT exist'
  END AS function_status;

