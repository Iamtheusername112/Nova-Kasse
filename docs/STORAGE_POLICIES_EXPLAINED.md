# Storage Bucket Policies Explained

## Overview

The storage policies ensure that users can only access their own documents. Each policy uses Row Level Security (RLS) to enforce access control based on the authenticated user's ID.

## File Path Structure

Files are stored with this structure:
```
user-documents/
  └── {user-id}/
      ├── id-{timestamp}-{filename}
      └── address-{timestamp}-{filename}
```

The first folder in the path is the user's UUID, which is used to verify ownership.

## Policy Breakdown

### Policy 1: INSERT (Upload)
```sql
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:**
- Allows authenticated users to upload files
- Only if the file path starts with their user ID
- Prevents users from uploading to other users' folders

**Example:**
- ✅ User `abc-123` can upload to `abc-123/document.pdf`
- ❌ User `abc-123` cannot upload to `xyz-789/document.pdf`

### Policy 2: SELECT (View/Download)
```sql
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:**
- Allows users to view/download their own files
- Only files in folders matching their user ID
- Prevents access to other users' documents

**Example:**
- ✅ User `abc-123` can view `abc-123/id-1234567890-passport.jpg`
- ❌ User `abc-123` cannot view `xyz-789/id-1234567890-passport.jpg`

### Policy 3: UPDATE (Replace)
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

**What it does:**
- Allows users to replace/update their own files
- Checks both the existing file (USING) and new file (WITH CHECK)
- Ensures users can't move files to other users' folders

**Example:**
- ✅ User `abc-123` can replace `abc-123/id-1234567890-passport.jpg`
- ❌ User `abc-123` cannot update `xyz-789/id-1234567890-passport.jpg`

### Policy 4: DELETE (Remove)
```sql
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:**
- Allows users to delete their own files
- Only files in their own folder
- Prevents deletion of other users' documents

**Example:**
- ✅ User `abc-123` can delete `abc-123/id-1234567890-passport.jpg`
- ❌ User `abc-123` cannot delete `xyz-789/id-1234567890-passport.jpg`

## Key Security Features

1. **User Isolation**: Each user can only access files in their own folder
2. **Authentication Required**: All policies require `TO authenticated` - anonymous users cannot access
3. **Path Validation**: Uses `storage.foldername(name)[1]` to extract the first folder (user ID)
4. **Bucket Restriction**: All policies check `bucket_id = 'user-documents'` to ensure they only apply to this bucket

## How It Works

The `storage.foldername(name)` function splits the file path by `/` and returns an array:
- Path: `abc-123/id-1234567890-passport.jpg`
- `storage.foldername(name)[1]` = `abc-123` (first folder = user ID)
- `auth.uid()::text` = current authenticated user's ID as text

If they match, the user owns the file and can access it.

## Testing Policies

To verify policies are working:

1. **Test Upload:**
   - Sign up as a new user
   - Upload documents during signup
   - Check Storage → `user-documents` → Should see folder with user ID

2. **Test Access:**
   - Try to access another user's document URL
   - Should get permission denied error

3. **Verify in SQL:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage' 
   AND policyname LIKE '%documents%';
   ```

## Common Issues

### "Permission denied" error
- **Cause**: User trying to access file outside their folder
- **Solution**: Verify file path starts with user's ID

### "Bucket not found" error
- **Cause**: Bucket doesn't exist or wrong name
- **Solution**: Create bucket named exactly `user-documents`

### Policies not applying
- **Cause**: RLS might be disabled on storage.objects
- **Solution**: RLS is automatically enabled when you create policies

## Optional: Admin Access

If you need admin/support staff to view all documents, you can add this policy:

```sql
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
```

Then set the admin role in user metadata:
```javascript
await supabase.auth.updateUser({
  data: { role: 'admin' }
});
```

