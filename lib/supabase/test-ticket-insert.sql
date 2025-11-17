-- Test script to verify ticket insert works with RLS
-- NOTE: auth.uid() will be NULL when running SQL directly in the SQL Editor
-- This is expected - RLS policies work when queries are made through the Supabase client with an authenticated session
-- To test RLS, you need to test from the frontend application, not from SQL Editor

-- Check if tickets table exists and RLS is enabled
SELECT 
  'Tickets table exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets')
    THEN '✓ YES'
    ELSE '✗ NO'
  END as status
UNION ALL
SELECT 
  'RLS is enabled',
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'tickets') = true
    THEN '✓ YES'
    ELSE '✗ NO'
  END;

-- List all RLS policies on tickets table
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Users can view own tickets'
    WHEN cmd = 'INSERT' THEN 'Users can create own tickets'
    WHEN cmd = 'UPDATE' THEN 'Users can update own tickets'
    ELSE 'Other'
  END as description
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;

-- Note: To actually test ticket creation, you need to:
-- 1. Log in to your app as a regular user (not admin)
-- 2. Get blocked (or manually test the ticket form)
-- 3. Try to submit a ticket from the frontend
-- 4. Check browser console for detailed error messages

