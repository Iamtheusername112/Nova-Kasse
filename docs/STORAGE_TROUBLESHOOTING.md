# Storage Upload Troubleshooting

## Error: "new row violates row-level security policy"

This error means the storage bucket policies aren't set up correctly or the user doesn't have an active session.

### Solution 1: Create Storage Policies

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `lib/supabase/storage-policies.sql`
3. Click "Run"
4. Verify policies were created:
   - Go to Storage → `user-documents` → Policies
   - You should see 4 policies listed

### Solution 2: Verify Bucket Exists

1. Go to Storage → Check if `user-documents` bucket exists
2. If it doesn't exist, create it:
   - Name: `user-documents`
   - Public: Unchecked (private)
   - File size limit: 5 MB
   - MIME types: `*/*` (or leave unchecked)

### Solution 3: Check Session

The upload requires an active session. The code now:
- Checks for session after signup
- Automatically signs in if needed
- Only uploads if session exists

If you still get errors:
1. Check browser console for session info
2. Verify email confirmation is disabled in Supabase
3. Try signing in manually after signup

### Solution 4: Verify Policy Syntax

Run this SQL to check if policies exist:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%documents%';
```

You should see 4 policies:
- Users can upload own documents
- Users can view own documents
- Users can update own documents
- Users can delete own documents

### Solution 5: Test Policy Manually

Try uploading a test file via Supabase Dashboard:
1. Go to Storage → `user-documents`
2. Try uploading a file manually
3. If it fails, the policies aren't working

### Common Issues

**Issue**: Policies created but still getting RLS error
- **Solution**: Make sure policies are enabled (not disabled)
- Check that RLS is enabled on the storage.objects table

**Issue**: Session exists but upload fails
- **Solution**: Verify the file path matches policy expectations
- Path should be: `{user-id}/{filename}`
- Check console logs for the actual path being used

**Issue**: Works in dashboard but not in app
- **Solution**: Check that you're using the same Supabase project
- Verify environment variables are correct
- Check browser console for detailed error messages

## Quick Fix Checklist

- [ ] Bucket `user-documents` exists
- [ ] Storage policies SQL has been run
- [ ] Policies are enabled (not disabled)
- [ ] User has active session when uploading
- [ ] File path format is `{user-id}/{filename}`
- [ ] File size is under 5MB
- [ ] Storage API is enabled in project settings

