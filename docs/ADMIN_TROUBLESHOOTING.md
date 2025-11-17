# Admin Login Troubleshooting Guide

## Common Errors and Solutions

### Error: "Invalid login credentials"

This error occurs when:
1. The user doesn't exist in Supabase
2. The password is incorrect
3. The email is incorrect

#### Solution Steps:

1. **Verify User Exists:**
   - Go to Supabase Dashboard → Authentication → Users
   - Search for `admin@novakasse.com`
   - If user doesn't exist, create it:
     - Click "Add User" → "Create new user"
     - Email: `admin@novakasse.com`
     - Password: `Nova_20100`
     - Auto Confirm User: ✅ Yes

2. **Check Password:**
   - Ensure password is exactly: `Nova_20100` (case-sensitive)
   - No extra spaces before or after
   - Check for typos

3. **Check Email:**
   - Ensure email is exactly: `admin@novakasse.com` (lowercase)
   - No extra spaces
   - Check for typos

4. **Reset Password (if needed):**
   - Go to Supabase Dashboard → Authentication → Users
   - Click on `admin@novakasse.com`
   - Click "Reset Password" or "Update Password"
   - Set new password: `Nova_20100`
   - Save changes

### Error: "Email not confirmed"

**Solution:**
- Go to Supabase Dashboard → Authentication → Users
- Find `admin@novakasse.com`
- Click on the user
- Enable "Auto Confirm User" or manually confirm the email

### Error: "Access denied. Admin credentials required."

This means login succeeded but user is not an admin.

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click on `admin@novakasse.com`
3. Scroll to "User Metadata"
4. Add field:
   - Key: `role`
   - Value: `admin`
5. Click "Save"

### Error: "Too many requests"

**Solution:**
- Wait a few minutes before trying again
- This is a rate limiting protection

## Quick Fix Checklist

- [ ] User `admin@novakasse.com` exists in Supabase
- [ ] Password is exactly `Nova_20100` (case-sensitive)
- [ ] Email is exactly `admin@novakasse.com` (lowercase)
- [ ] User is auto-confirmed (no email verification needed)
- [ ] User metadata has `role: admin`
- [ ] No extra spaces in email or password fields

## Verify Admin User Setup

Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'admin@novakasse.com';
```

Expected results:
- `email`: `admin@novakasse.com`
- `email_confirmed_at`: Should have a timestamp (not null)
- `role`: `admin`
- `created_at`: Should have a timestamp

## Still Having Issues?

1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for detailed error messages

2. **Check Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try logging in
   - Check the failed request for details

3. **Verify Supabase Connection:**
   - Check `.env.local` file has correct Supabase URL and keys
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

4. **Test with SQL:**
   ```sql
   -- Check if user exists
   SELECT * FROM auth.users WHERE email = 'admin@novakasse.com';
   
   -- Check user metadata
   SELECT raw_user_meta_data FROM auth.users WHERE email = 'admin@novakasse.com';
   ```

5. **Create User via SQL (if dashboard doesn't work):**
   ```sql
   -- Note: This requires service role key or admin access
   -- Use Supabase Management API instead:
   ```
   
   Use the API method from `docs/ADMIN_SETUP.md` Option B

## Alternative: Create Admin User via API

If dashboard method doesn't work, use the Supabase Management API:

```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/auth/v1/admin/users' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@novakasse.com",
    "password": "Nova_20100",
    "email_confirm": true,
    "user_metadata": {
      "role": "admin"
    }
  }'
```

Replace:
- `YOUR_PROJECT_ID` with your Supabase project ID
- `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Project Settings → API)

