# How to Verify Storage Bucket Exists

## Quick Check

1. Go to **Supabase Dashboard**
2. Click **Storage** in the left sidebar
3. Look for a bucket named **`user-documents`**
4. If it doesn't exist, create it (see below)

## Create the Bucket

If the bucket doesn't exist:

1. Go to **Storage** → Click **"New bucket"**
2. Configure:
   - **Name**: `user-documents` (exact name, lowercase, with hyphen)
   - **Public bucket**: ❌ **Unchecked** (keep it private)
   - **File size limit**: ☑ **Checked** - Set to **5 MB**
   - **Restrict MIME types**: ☐ **Unchecked** (allow all file types)
3. Click **"Create bucket"**

## Verify Bucket Settings

After creating, verify:
- ✅ Bucket name is exactly `user-documents` (case-sensitive)
- ✅ Public bucket is **OFF** (private)
- ✅ File size limit is set (recommended: 5 MB)

## Run Storage Policies

After creating the bucket, run the storage policies:

1. Go to **SQL Editor** → **New Query**
2. Copy contents of `lib/supabase/storage-policies.sql`
3. Click **Run**

## Test Upload

After setup, try uploading a document again. The error should be resolved.

## Common Issues

### Error: "Object not found"
- **Cause**: Bucket doesn't exist or name is misspelled
- **Fix**: Create bucket with exact name `user-documents`

### Error: "Permission denied" or "RLS policy violation"
- **Cause**: Storage policies not set up
- **Fix**: Run `lib/supabase/storage-policies.sql` in SQL Editor

### Error: "File too large"
- **Cause**: File exceeds bucket size limit
- **Fix**: Increase file size limit in bucket settings or compress file

