# Admin API Setup Guide

## Required Environment Variable

The admin user management API requires a service role key to access all users.

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **API**
3. Find **"Service Role Key"** (NOT the anon key)
4. Copy the service role key

### Step 2: Add to Environment Variables

Add the service role key to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:**
- The service role key should NEVER be exposed in client-side code
- It's only used in server-side API routes (`app/api/admin/users/route.js`)
- Never commit `.env.local` to version control

### Step 3: Restart Your Development Server

After adding the environment variable:

1. Stop your development server (Ctrl+C)
2. Start it again: `npm run dev`
3. The API route should now work

### Step 4: Verify Setup

1. Navigate to `/admin/users` in your app
2. You should see the list of users
3. If you see an error, check:
   - Is `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`?
   - Did you restart the dev server?
   - Check browser console for detailed error messages

## Security Notes

⚠️ **CRITICAL SECURITY WARNINGS:**

1. **Never expose service role key**: The service role key bypasses Row Level Security (RLS) and has full database access
2. **Server-side only**: The API route runs on the server, so the key is never exposed to the client
3. **Protect the API route**: Consider adding additional authentication/authorization checks
4. **Environment variables**: Never commit `.env.local` to git

## Troubleshooting

### Error: "Service role key not configured"

**Solution:**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Restart your development server
- Make sure the key is correct (copy from Supabase Dashboard)

### Error: "Failed to fetch users"

**Possible causes:**
1. Service role key is incorrect
2. Supabase URL is incorrect
3. Network/firewall issues
4. API route error

**Solution:**
- Check browser console for detailed error
- Check server logs/terminal for API route errors
- Verify environment variables are set correctly
- Test Supabase connection

### Users list is empty

**Possible causes:**
1. No users in the database
2. Profiles table is empty
3. RLS policies blocking access

**Solution:**
- Check Supabase Dashboard → Table Editor → profiles
- Verify users exist in Authentication → Users
- Check if profiles table has data

## Alternative: Direct Database Query (If API Route Fails)

If the API route doesn't work, you can temporarily query profiles directly (but won't get emails):

```javascript
// In useUsers.js - temporary fallback
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .order("created_at", { ascending: false });
```

However, this won't include email addresses since they're in `auth.users` which requires admin access.

