# Admin Dashboard Setup Guide

This guide will help you set up the admin dashboard and create the admin user account.

## Admin Credentials

- **Email**: `admin@novakasse.com`
- **Password**: `Nova_20100`

## Step 1: Create Admin User in Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** → **"Create new user"**
4. Fill in the details:
   - **Email**: `admin@novakasse.com`
   - **Password**: `Nova_20100`
   - **Auto Confirm User**: ✅ Yes (to skip email verification)
5. Click **"Create User"**
6. After the user is created, click on the user to open their details
7. Scroll down to **"User Metadata"** section
8. Click **"Add Field"** button (or the "+" icon)
9. In the popup/form:
   - **Key**: Type `role`
   - **Value**: Type `admin` (as a string, not an object)
10. Click **"Save"** or **"Update"**

**Visual Guide:**
```
User Details Page
├── Email: admin@novakasse.com
├── User ID: [uuid]
├── Created At: [date]
└── User Metadata (scroll down)
    └── Click "Add Field" or "+"
        ├── Key: role
        └── Value: admin
        └── Click "Save"
```

### Alternative: Edit Existing User Metadata

If the user already exists:

1. Go to **Authentication** → **Users**
2. Find and click on `admin@novakasse.com`
3. Scroll to **"User Metadata"** section
4. You'll see a JSON editor or key-value pairs
5. If it's a JSON editor, add:
   ```json
   {
     "role": "admin"
   }
   ```
6. If it's key-value fields:
   - Click **"Add Field"**
   - Key: `role`
   - Value: `admin`
7. Click **"Save"** or **"Update User"**

### Option B: Using Supabase Management API

If you prefer to use the API, you can create the admin user programmatically:

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

**Note**: Replace `YOUR_PROJECT_ID` and `YOUR_SERVICE_ROLE_KEY` with your actual values.

### Option C: Using SQL Function

1. First, create the user manually via Dashboard (steps above)
2. Run the SQL script: `lib/supabase/create-admin-user.sql` in Supabase SQL Editor
3. Execute:
   ```sql
   SELECT set_admin_role('admin@novakasse.com');
   ```

## Step 2: Verify Admin User

Run this SQL query in Supabase SQL Editor to verify:

```sql
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'admin@novakasse.com';
```

You should see:
- `email`: `admin@novakasse.com`
- `role`: `admin`

**Or check in Dashboard:**
1. Go to **Authentication** → **Users**
2. Click on `admin@novakasse.com`
3. Scroll to **"User Metadata"**
4. You should see: `role: admin`

## Step 3: Access Admin Dashboard

1. Navigate to `/admin/login` in your application
2. Enter credentials:
   - Email: `admin@novakasse.com`
   - Password: `Nova_20100`
3. You will be redirected to `/admin/dashboard`

## Admin Features

The admin dashboard includes:

- **User Management**: View and manage all user accounts
- **Transaction Monitoring**: Monitor all transactions
- **Financial Reports**: View financial analytics
- **KYC Verification**: Review and verify user documents
- **Account Management**: Handle account issues and disputes

## Security Notes

1. **Change Default Password**: After first login, consider changing the admin password
2. **Service Role Key**: Never expose your Supabase service role key in client-side code
3. **Admin Routes**: All admin routes are protected and require admin role verification
4. **Session Management**: Admin sessions follow the same security rules as regular users

## Troubleshooting

### "Access Denied" Error

- Verify the user exists in Supabase Authentication
- Check that `user_metadata.role` is set to `"admin"` (exactly as shown, lowercase)
- Ensure you're using the correct email: `admin@novakasse.com`
- Check the user metadata format - it should be a string `"admin"`, not an object

### Cannot Login

- Verify the password is correct: `Nova_20100`
- Check if email confirmation is required (should be auto-confirmed)
- Check browser console for error messages

### Admin Dashboard Not Loading

- Ensure you're accessing `/admin/dashboard` (not `/admin`)
- Check that `AdminProtectedRoute` component is working
- Verify user session is active
- Check browser console for errors

### User Metadata Not Saving

- Make sure you clicked "Save" or "Update User" after adding the metadata
- Refresh the page and check again
- Try using the SQL query to verify: `SELECT raw_user_meta_data FROM auth.users WHERE email = 'admin@novakasse.com';`
- The metadata should show: `{"role": "admin"}`

## Quick Verification Checklist

- [ ] User `admin@novakasse.com` exists in Authentication → Users
- [ ] User Metadata shows `role: admin`
- [ ] Can login at `/admin/login` with credentials
- [ ] Redirects to `/admin/dashboard` after login
- [ ] Regular users cannot access `/admin/dashboard`

## Next Steps

After setting up the admin user, you can:

1. Customize the admin dashboard (`app/admin/dashboard/page.js`)
2. Add more admin features (user management, transaction monitoring, etc.)
3. Set up admin-specific database policies
4. Configure admin notifications and alerts
