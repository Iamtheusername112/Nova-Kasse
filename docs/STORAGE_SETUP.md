# Supabase Storage Setup for Document Uploads

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Click on "Storage" in the left sidebar
3. Click "New bucket"
4. Configure the bucket:
   - **Name**: `user-documents`
   - **Public bucket**: ❌ Unchecked (keep it private for security)
   - **Restrict file size**: ☑ Checked - Set to **5 MB** (or your preferred limit)
   - **Restrict MIME types**: ☐ **Unchecked** (allow all file types)
5. Click "Create bucket"

**Note**: We allow all file types to prevent user errors. The file size limit of 5MB still applies for security and storage management.

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies.

### Option A: Using SQL Editor (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `lib/supabase/storage-policies.sql`
4. Click "Run" (or press Ctrl+Enter)

This will create all 4 policies at once:
- ✅ Users can upload own documents
- ✅ Users can view own documents  
- ✅ Users can update own documents
- ✅ Users can delete own documents

### Option B: Using Storage UI

Alternatively, you can create policies one by one in the Storage UI:

1. Go to Storage → `user-documents` → Policies
2. Click "New Policy" for each policy below

**Policy 1: Users can upload own documents**
```sql
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Users can view own documents**
```sql
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3: Users can update own documents**
```sql
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
```

**Policy 4: Users can delete own documents**
```sql
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Verify Policies

After creating the policies, verify they exist:

1. Go to Storage → `user-documents` → Policies
2. You should see 4 policies listed:
   - Users can upload own documents
   - Users can view own documents
   - Users can update own documents
   - Users can delete own documents

Or run this SQL query to verify:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%documents%';
```

## Step 4: Enable Storage API

1. Go to Settings → API
2. Make sure Storage API is enabled
3. Note your project URL and anon key (already in your `.env.local`)

## Step 5: Test Document Upload

After setting up the bucket and policies, test the signup flow:

1. Go to the signup page
2. Fill in all required fields
3. Upload test documents (any file type - images, PDFs, Word docs, etc.)
4. Complete the signup process
5. Check Storage → `user-documents` → You should see folders named with user IDs containing the uploaded documents

## File Structure

Documents are stored in the following structure:
```
user-documents/
  └── {user-id}/
      ├── id-{timestamp}-{filename}
      └── address-{timestamp}-{filename}
```

## Security Notes

- Documents are stored privately (not publicly accessible)
- Only the user who uploaded them can access their documents
- File paths include user ID to ensure proper access control
- File size is limited to 5MB per file
- All file types are accepted to prevent user errors

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the bucket with the exact name `user-documents`
- Check that Storage API is enabled in your project settings

### Error: "Permission denied"
- Verify that you've created all three RLS policies
- Check that policies are enabled (not disabled)
- Make sure the user is authenticated when uploading

### Error: "File too large"
- Check the bucket's file size limit
- Ensure uploaded files are under 5MB

### Documents not appearing
- Check the browser console for upload errors
- Verify the upload function is being called
- Check Supabase Storage logs in the dashboard

