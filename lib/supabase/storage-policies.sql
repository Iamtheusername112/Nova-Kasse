-- Storage Bucket Policies for user-documents
-- Run this SQL in your Supabase SQL Editor after creating the bucket
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- First, make sure the bucket exists (create it manually in Storage UI first)
-- Bucket name: user-documents
-- Public: false (private)
-- File size limit: 5 MB
-- Allowed MIME types: image/*,application/pdf

-- ============================================
-- POLICY 1: Users can upload their own documents
-- ============================================
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;

-- This policy allows authenticated users to upload files to their own folder
-- Files are stored in: {user_id}/{filename}
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLICY 2: Users can view their own documents
-- ============================================
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;

-- This policy allows users to read/download their own uploaded documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLICY 3: Users can update their own documents
-- ============================================
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;

-- This policy allows users to update/replace their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLICY 4: Users can delete their own documents
-- ============================================
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- This policy allows users to delete their own uploaded documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- OPTIONAL: Admin can view all documents
-- ============================================
-- Uncomment this if you need admin/support staff to view all documents
-- Replace 'admin-role-name' with your actual admin role or use service_role
-- CREATE POLICY "Admins can view all documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'user-documents' AND
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND auth.users.raw_user_meta_data->>'role' = 'admin'
--   )
-- );

-- ============================================
-- Verify policies were created
-- ============================================
-- Run this query to verify all policies exist:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

